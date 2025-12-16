"""Event API endpoints for React frontend."""
from distutils.util import strtobool

import flask_login
import pytz
from dateutil import parser
from dateutil.tz import UTC
from flask import Blueprint, request, jsonify
from flask_login import login_required

from crewlog import db
from crewlog.event import event_dao

bp = Blueprint("api_event", __name__, url_prefix="/api/v1/calendars/events")


@bp.route('/', methods=['GET'])
@login_required
def get_events():
    """Get events for date range."""
    start = parser.isoparse(request.args.get('start')).astimezone(UTC)
    end = parser.isoparse(request.args.get('end')).astimezone(UTC)
    events = [event.serialized for event in event_dao.get_events(start, end)]
    return jsonify(events)


@bp.route('/', methods=['POST'])
@login_required
def create_event():
    """Create or update an event."""
    data = request.get_json()
    
    all_day = False
    event_id = None
    recur_id = None
    recurrent = None
    description = None
    init_start = None
    timezone = None
    recurrent_interval = None
    
    # Parse timezone first
    if data.get('timeZone'):
        timezone = pytz.timezone(data['timeZone'])
    
    # Parse start and end times
    start = parser.parse(data['start'])
    end = parser.parse(data['end'])
    
    # Handle timezone conversion
    if start.tzinfo is None and timezone:
        start = timezone.localize(start).astimezone(UTC).replace(tzinfo=None)
    elif start.tzinfo is not None:
        start = start.astimezone(UTC).replace(tzinfo=None)
        
    if end.tzinfo is None and timezone:
        end = timezone.localize(end).astimezone(UTC).replace(tzinfo=None)
    elif end.tzinfo is not None:
        end = end.astimezone(UTC).replace(tzinfo=None)
    
    title = data.get('eventTitle')
    if not title:
        return jsonify({'message': 'Event title is required'}), 400
    
    if 'description' in data:
        description = data['description']
    if 'recurrent' in data:
        recurrent = data['recurrent']
    if 'recurrentInterval' in data:
        recurrent_interval = data['recurrentInterval']
    if 'allDay' in data:
        all_day = bool(data['allDay']) if isinstance(data['allDay'], bool) else bool(strtobool(str(data['allDay'])))
    if data.get('eventId'):
        event_id = data['eventId']
    if data.get('recurId'):
        recur_id = data['recurId']
    if recur_id and not event_id:
        if data.get('initStart'):
            init_start = parser.parse(data['initStart'])
    
    event_dao.save_event(
        title=title, 
        description=description, 
        start=start, 
        end=end, 
        all_day=all_day,
        event_id=event_id, 
        recur_id=recur_id, 
        recurrent=recurrent,
        recurrent_interval=recurrent_interval,
        init_start=init_start,
        timezone=timezone
    )
    
    return jsonify({'message': 'Event saved successfully'})


@bp.route('/', methods=['DELETE'])
@login_required
def delete_event():
    """Delete an event."""
    data = request.get_json()
    event_id = data.get('eventId')
    
    if event_id:
        event_dao.remove_event(event_id)
    else:
        recur_id = data.get('recurId')
        start = parser.parse(data['start'])
        event_dao.remove_group_event(recur_id=recur_id, start=start)
    
    return jsonify({'message': 'Event deleted successfully'})


@bp.route('/recurrent', methods=['DELETE'])
@login_required
def delete_recurrent_event():
    """Delete a single occurrence of a recurrent event."""
    data = request.get_json()
    recur_id = data.get('recurId')
    start = parser.parse(data['start'])
    end = parser.parse(data['end'])
    
    event = event_dao.generate_event(recur_id, start=start, end=end)
    event.hide = True
    event_dao.save_event(event=event)
    
    return jsonify({'message': 'Event occurrence hidden'})


@bp.route('/shifts', methods=['POST'])
@login_required
def save_shift():
    """Save shifts for an event."""
    data = request.get_json()
    
    event_id = data.get('eventId')
    recur_id = data.get('recurId')
    start = parser.parse(data['start'])
    end = parser.parse(data['end'])
    person_name = data.get('newNameText')
    
    shift_ids_to_remove = []
    for key in data.keys():
        if "CheckBox" in key and data[key] == "false":
            shift_id = key[13:]
            shift_ids_to_remove.append(shift_id)
    
    event_dao.save_shift(
        event_id=event_id, 
        new_person_name=person_name, 
        shift_ids_to_remove=shift_ids_to_remove,
        recur_id=recur_id, 
        start=start, 
        end=end
    )
    
    return jsonify({'message': 'Shifts saved successfully'})


@bp.route('/<event_id>/details', methods=['GET'])
@login_required
def get_event_details(event_id):
    """Get event details including volunteers."""
    event = event_dao.get_event(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    volunteers = [{'id': str(shift.id), 'person': shift.person} for shift in event.shifts]
    
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
@login_required
def update_recurrent_event():
    """Update recurrent event."""
    data = request.get_json()
    
    recurrent_change = data.get('recurrentChange', 'following')
    recur_id = data.get('recurId')
    event_id = data.get('eventId')
    start = parser.parse(data['start'])
    end = parser.parse(data['end'])
    init_start = parser.parse(data['initStart'])
    timezone = pytz.timezone(data['timeZone'])
    title = data.get('eventTitle')
    description = data.get('description', '')
    all_day = bool(data.get('allDay', False))
    
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
        event_dao.save_group_event(
            recur_id=recur_id, 
            start=start, 
            end=end, 
            timezone=timezone, 
            init_start=init_start,
            all_day=all_day, 
            title=title, 
            description=description
        )
    
    return jsonify({'message': 'Recurrent event updated'})