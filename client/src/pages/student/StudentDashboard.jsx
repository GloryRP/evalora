/**
 * Student Dashboard Page
 */
import { useState, useEffect } from 'react';
import { Calendar, BookOpen, Bell } from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hallTicketRes, notificationsRes] = await Promise.all([
        api.get('/student/hall-ticket'),
        api.get('/notifications'),
      ]);

      if (hallTicketRes.data?.success) {
        setStudent(hallTicketRes.data.data.student);
        setUpcomingExams(hallTicketRes.data.data.exams.slice(0, 3));
      }

      if (notificationsRes.data?.success) {
        setNotifications(notificationsRes.data.data.notifications.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}><LoadingSkeleton count={5} /></div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
          Welcome, {student?.name}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          USN: {student?.usn} | Department: {student?.department} | Semester: {student?.semester}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #E5E5E5', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Total Exams</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-navy)' }}>{upcomingExams.length}</div>
        </div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #E5E5E5', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Notifications</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-gold)' }}>{notifications.length}</div>
        </div>
      </div>

      {/* Upcoming Exams */}
      <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid #E5E5E5', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-navy)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} /> Upcoming Exams
        </h2>
        {upcomingExams.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>No upcoming exams</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {upcomingExams.map((exam, idx) => (
              <div key={idx} style={{ padding: '1rem', background: 'var(--color-bg)', borderRadius: '6px', borderLeft: '4px solid var(--color-gold)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: '600', color: 'var(--color-text)' }}>{exam.subject}</p>
                    <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{exam.subjectCode} • {exam.date}</p>
                  </div>
                  <span style={{ padding: '0.5rem 1rem', background: '#2D7A5F20', color: '#2D7A5F', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '500' }}>
                    Seat {exam.seatNumber}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Notifications */}
      <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', border: '1px solid #E5E5E5', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-navy)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={20} /> Recent Notifications
        </h2>
        {notifications.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>No notifications</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {notifications.map((notif) => (
              <div key={notif._id} style={{ padding: '1rem', background: notif.isRead ? 'white' : '#F5F9FC', borderRadius: '6px', borderLeft: '3px solid ' + (notif.isRead ? 'transparent' : 'var(--color-gold)') }}>
                <p style={{ margin: '0 0 0.25rem 0', fontWeight: notif.isRead ? '400' : '600', color: 'var(--color-text)' }}>{notif.title}</p>
                <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{notif.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
