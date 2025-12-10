from distutils.util import strtobool

import flask_login
import pytz
from dateutil import parser
from dateutil.tz import UTC
from flask import Blueprint, request, jsonify

from crewlog import db
from crewlog.event import event_dao
from crewlog.event.models import Event, Shift

bp = Blueprint("event_api", __name__, url_prefix="/api/v1/calendars/events")


@bp.route('/', methods=['GET'])
@flask_login.login_required
def get_events():
    start = parser.isoparse(request.args.get('start')).astimezone(UTC)
    end = parser.isoparse(request.args.get('end')).astimezone(UTC)
    events = [event.serialized for event in event_dao.get_events(start, end)]
    return jsonify(events)


@bp.route('/', methods=['POST'])
@flask_login.login_required
def post_event(all_day=False, event_id=None, recur_id=None, recurrent=None, description=None, init_start=None,
               timezone=None, recurrent_interval=None):
    # Parse timezone first so we can use it for datetime conversion
    if request.form['timeZone']:
        timezone = pytz.timezone(request.form['timeZone'])
    
    # Parse start and end times
    start = parser.parse(request.form['start'])
    end = parser.parse(request.form['end'])
    
    # If the datetime is naive (no timezone info), localize it to the user's timezone
    # then convert to UTC for storage
    if start.tzinfo is None and timezone:
        start = timezone.localize(start).astimezone(UTC).replace(tzinfo=None)
    elif start.tzinfo is not None:
        start = start.astimezone(UTC).replace(tzinfo=None)
        
    if end.tzinfo is None and timezone:
        end = timezone.localize(end).astimezone(UTC).replace(tzinfo=None)
    elif end.tzinfo is not None:
        end = end.astimezone(UTC).replace(tzinfo=None)
    
    title = request.form['eventTitle']
    if 'description' in request.form:
        description = request.form['description']
    if 'recurrent' in request.form:
        recurrent = request.form['recurrent']
    if 'recurrentInterval' in request.form:
        recurrent_interval = request.form['recurrentInterval']
    if 'allDay' in request.form:
        all_day = bool(strtobool(request.form['allDay']))
    if 'eventId' in request.form and request.form['eventId']:
        event_id = request.form['eventId']
    if 'recurId' in request.form:
        recur_id = request.form['recurId']
    if recur_id and not event_id:
        if 'initStart' in request.form:
            init_start = parser.parse(request.form['initStart'])
    event_dao.save_event(title=title, description=description, start=start, end=end, all_day=all_day,
                         event_id=event_id, recur_id=recur_id, recurrent=recurrent,
                         recurrent_interval=recurrent_interval,
                         init_start=init_start,
                         timezone=timezone)
    return '', 204


@bp.route('/', methods=['DELETE'])
@flask_login.login_required
def delete_event():
    event_id = request.form['eventId']
    if event_id:
        event_dao.remove_event(event_id)
    else:
        recur_id = request.form['recurId']
        start = parser.parse(request.form['start'])
        event_dao.remove_group_event(recur_id=recur_id, start=start)
    return '', 204


@bp.route('/recurrent', methods=['DELETE'])
@flask_login.login_required
def delete_recurrent_event():
    recur_id = request.form['recurId']
    start = parser.parse(request.form['start'])
    end = parser.parse(request.form['end'])
    event = event_dao.generate_event(recur_id, start=start, end=end)
    event.hide = True
    event_dao.save_event(event=event)
    return '', 204


@bp.route('/shifts', methods=['POST'])
@flask_login.login_required
def post_shift(person_name=None, event_id=None):
    if 'eventId' in request.form:
        event_id = request.form['eventId']
    recur_id = request.form['recurId']
    start = parser.parse(request.form['start'])
    end = parser.parse(request.form['end'])
    if request.form['newNameText']:
        person_name = request.form['newNameText']
    shift_ids_to_remove = []
    for key in request.form.keys():
        if "CheckBox" in key and request.form[key] == "false":
            shift_id = key[13:]
            shift_ids_to_remove.append(shift_id)
    event_dao.save_shift(event_id=event_id, new_person_name=person_name, shift_ids_to_remove=shift_ids_to_remove,
                         recur_id=recur_id, start=start, end=end)
    return '', 204


@bp.route('/<event_id>/details', methods=['GET'])
@flask_login.login_required
def get_event_details(event_id):
    """Get event details including all volunteers assigned to this event."""
    event = event_dao.get_event(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Get all volunteers for this event
    volunteers = [shift.person for shift in event.shifts]
    
    return jsonify({
        'id': str(event.id),
        'title': event.title,
        'description': event.description or '',
        'start': event.start.isoformat() + 'Z' if event.start else None,
        'end': event.end.isoformat() + 'Z' if event.end else None,
        'all_day': event.all_day,
        'volunteers': volunteers
    })


@bp.route('/recurrent', methods=['POST'])
@flask_login.login_required
def post_recurrent(recurrent_change='following'):
    if 'recurrentChange' in request.form:
        recurrent_change = request.form['recurrentChange']
    recur_id = request.form['recurId']
    event_id = request.form['eventId']
    start = parser.parse(request.form['start'])
    end = parser.parse(request.form['end'])
    init_start = parser.parse(request.form['initStart'])
    timezone = pytz.timezone(request.form['timeZone'])
    title = request.form['eventTitle']
    description = request.form['description']
    if 'allDay' in request.form:
        all_day = bool(strtobool(request.form['allDay']))
    if recurrent_change == 'this':
        if event_id:
            event = event_dao.get_event(event_id=event_id)
            event.start = start
            event.end = end
        else:
            event = event_dao.generate_event(recur_id, start=start, end=end)
            event.init_start = init_start
        db.session.merge(event)
        db.session.commit()
    elif recurrent_change == 'following':
        event_dao.save_group_event(recur_id=recur_id, start=start, end=end, timezone=timezone, init_start=init_start,
                                   all_day=all_day, title=title, description=description)
    return '', 204
