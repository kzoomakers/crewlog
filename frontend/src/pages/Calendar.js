import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Container, Alert } from 'react-bootstrap';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '../contexts/AuthContext';
import { eventApi } from '../services/api';
import EventModal from '../components/modals/EventModal';
import ShiftsModal from '../components/modals/ShiftsModal';
import RecurrentModal from '../components/modals/RecurrentModal';

const Calendar = () => {
  const { currentCalendar, calendars } = useAuth();
  const calendarRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [editable, setEditable] = useState(false);
  
  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showShiftsModal, setShowShiftsModal] = useState(false);
  const [showRecurrentModal, setShowRecurrentModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState(null);

  // Get current role
  const getCurrentRole = useCallback(() => {
    if (!currentCalendar || !calendars) return null;
    return calendars.find(c => c.calendar_id === currentCalendar.id);
  }, [currentCalendar, calendars]);

  const currentRole = getCurrentRole();
  const isManager = currentRole && currentRole.type >= 50;

  // Get calendar settings
  const settings = currentCalendar?.settings ? 
    (typeof currentCalendar.settings === 'string' ? 
      JSON.parse(currentCalendar.settings) : currentCalendar.settings) : 
    {
      scrollTime: '16:00:00',
      firstDay: 1,
      slotMinTime: '09:00:00',
      slotMaxTime: '22:00:00',
      nextDayThreshold: '00:00:00'
    };

  // Fetch events
  const fetchEvents = useCallback(async (fetchInfo, successCallback, failureCallback) => {
    try {
      const response = await eventApi.getEvents(fetchInfo.startStr, fetchInfo.endStr);
      successCallback(response.data);
    } catch (err) {
      setError('Failed to load events');
      failureCallback(err);
    }
  }, []);

  // Handle date selection (create new event)
  const handleDateSelect = (selectInfo) => {
    if (!editable) return;
    
    setSelectedDateRange({
      start: selectInfo.start,
      end: selectInfo.end,
      allDay: selectInfo.allDay
    });
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  // Handle event click
  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    const eventData = {
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end || event.start,
      allDay: event.allDay,
      description: event.extendedProps.description || '',
      recurId: event.extendedProps.recurId
    };

    if (editable) {
      // Edit mode - show event modal
      setSelectedEvent(eventData);
      setSelectedDateRange(null);
      setShowEventModal(true);
    } else {
      // View mode - show shifts modal
      setSelectedEvent(eventData);
      setShowShiftsModal(true);
    }
  };

  // Handle event drop/resize
  const handleEventChange = async (changeInfo) => {
    const event = changeInfo.event;
    const oldEvent = changeInfo.oldEvent;

    if (event.extendedProps.recurId && !event.id) {
      // Recurrent event without ID - show recurrent modal
      setSelectedEvent({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end || event.start,
        allDay: event.allDay,
        description: event.extendedProps.description || '',
        recurId: event.extendedProps.recurId,
        initStart: oldEvent.start
      });
      setShowRecurrentModal(true);
      return;
    }

    try {
      const data = {
        start: event.start.toISOString(),
        end: (event.end || event.start).toISOString(),
        eventTitle: event.title,
        eventId: event.id || '',
        recurId: event.extendedProps.recurId || '',
        initStart: oldEvent.start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        allDay: event.allDay,
        description: event.extendedProps.description || ''
      };
      await eventApi.updateEvent(data);
    } catch (err) {
      setError('Failed to update event');
      changeInfo.revert();
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditable(!editable);
  };

  // Refresh calendar
  const refreshCalendar = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().refetchEvents();
    }
  };

  // Check if mobile
  const isMobile = () => window.innerWidth < 768;

  if (!currentCalendar) {
    return (
      <Container className="py-4">
        <Alert variant="warning">
          Looks like you don't have any calendar selected. Select one from the menu above or create a new one.
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-3">
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      
      <div id="calendar-container">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={isMobile() ? 'timeGridDay' : 'timeGridWeek'}
          headerToolbar={{
            left: isMobile() ? 'prev,next' : `prev,next today${isManager ? ' toggleEditButton' : ''}`,
            center: 'title',
            right: isMobile() ? 'dayGridMonth,timeGridDay,listWeek' : 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          customButtons={isManager ? {
            toggleEditButton: {
              text: editable ? 'stop' : 'edit',
              click: toggleEditMode
            }
          } : {}}
          events={fetchEvents}
          editable={editable}
          selectable={editable}
          selectMirror={true}
          dayMaxEvents={true}
          nowIndicator={true}
          navLinks={true}
          stickyHeaderDates={true}
          height="auto"
          expandRows={true}
          slotDuration="00:15:00"
          snapDuration="00:15:00"
          scrollTime={settings.scrollTime}
          firstDay={parseInt(settings.firstDay)}
          slotMinTime={settings.slotMinTime}
          slotMaxTime={settings.slotMaxTime}
          nextDayThreshold={settings.nextDayThreshold}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          views={{
            listWeek: {
              titleFormat: isMobile() ? 
                { month: 'short', day: '2-digit' } : 
                { year: 'numeric', month: 'short', day: 'numeric' }
            },
            timeGridDay: {
              titleFormat: isMobile() ? 
                { month: 'short', day: '2-digit' } : 
                { year: 'numeric', month: 'long', day: 'numeric' }
            }
          }}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventChange}
          eventResize={handleEventChange}
          eventColor="#9F9C99"
        />
      </div>

      {/* Event Modal */}
      <EventModal
        show={showEventModal}
        onHide={() => setShowEventModal(false)}
        event={selectedEvent}
        dateRange={selectedDateRange}
        onSave={refreshCalendar}
      />

      {/* Shifts Modal */}
      <ShiftsModal
        show={showShiftsModal}
        onHide={() => setShowShiftsModal(false)}
        event={selectedEvent}
        onSave={refreshCalendar}
      />

      {/* Recurrent Modal */}
      <RecurrentModal
        show={showRecurrentModal}
        onHide={() => setShowRecurrentModal(false)}
        event={selectedEvent}
        onSave={refreshCalendar}
      />
    </Container>
  );
};

export default Calendar;