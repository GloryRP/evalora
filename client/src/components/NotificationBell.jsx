/**
 * Notification Bell Component
 * Shows notification count and dropdown panel
 * Polls for new notifications every 30 seconds
 */
import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import api from '../lib/api';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      if (response.data?.success) {
        setUnreadCount(response.data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Fetch notifications list
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications?limit=10');
      if (response.data?.success) {
        setNotifications(response.data.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    if (!isOpen && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,  // 8px below the bell
        left: rect.right + 8,  // 8px to the right of the bell
      });
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    // Small delay so the toggle click doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Initial fetch and polling
  useEffect(() => {
    fetchUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  // Format time ago
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <div ref={bellRef} style={{ position: 'relative' }}>
      {/* Bell Icon Button */}
      <button
        onClick={toggleDropdown}
        style={{
          position: 'relative',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 150ms ease',
          backgroundColor: isOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.background = 'transparent';
        }}
      >
        <Bell size={18} style={{ color: isOpen ? 'white' : 'rgba(255,255,255,0.75)' }} />
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#EF4444',
              color: 'white',
              fontSize: '0.6rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel - FIXED positioning */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: `${dropdownPos.top}px`,
            left: `${dropdownPos.left}px`,
            width: '360px',
            maxHeight: '480px',
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)',
            zIndex: 9999,
            border: '1px solid #EEEEEE',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px 12px 20px',
              borderBottom: '1px solid #F0F0F0',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-navy)' }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-gold)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ overflowY: 'auto', flexGrow: 1, padding: '8px 0' }}>
            {loading ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                <Bell size={32} style={{ color: '#DDD', marginBottom: '12px' }} />
                <p style={{ margin: 0 }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => {
                    if (!notif.isRead) {
                      markAsRead(notif._id);
                    }
                  }}
                  style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid #F8F8F8',
                    borderLeft: notif.isRead ? '3px solid transparent' : '3px solid var(--color-gold)',
                    background: notif.isRead ? 'white' : '#FFFBF0',
                    cursor: 'pointer',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F9F9F9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notif.isRead ? 'white' : '#FFFBF0';
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: notif.isRead ? 400 : 600, color: 'var(--color-text)', marginBottom: '3px' }}>
                    {notif.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      marginBottom: '4px',
                    }}
                  >
                    {notif.message}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#AAAAAA' }}>
                    {timeAgo(notif.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
