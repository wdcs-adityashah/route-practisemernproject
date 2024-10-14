"use client"
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Card from '@/components/card';
import FormComponent from '@/components/FormComponent';
import DynamicList from '@/components/DynamicList';
import { Item } from '@/types';
import SearchComponent from '@/components/SearchComponent';
import { useSearchParams } from 'next/navigation'

interface Notification extends Item {
  _id: string;
  title: string; 
}

export default function Notifications() {
  const [notificatonproductdata, setNotificatonProductData] = useState({
    title: '',
    description: '',
    brand:''
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [editFormData, setEditFormData] = useState<{ title: string }>({
    title: '',
  });
  const [editingNotificationId, setEditingNotificationId] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [notificationcount, setNotificationCount] = useState<number | null>(null); // Track the post count
  const [searchTerm,setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [notificationsPerPage] = useState(4);
  const [visiblePageRange, setVisiblePageRange] = useState([1, 5]); // Controls which pagination buttons are visible

  // Function to fetch notifications
  const fetchNotifications = async (searchQuery = '') => {
    try {
      const response = await axios.get(`http://localhost:3010/notification?query=${searchQuery}`);
      console.log('Fetched Notifications:', response.data); // Log the fetched notifications
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  

  useEffect(() => {
    const fetchData = async () => {
      await fetchNotifications(searchTerm); // Pass the search term here
    };
    fetchData();
  }, [searchTerm]);
  const fetchNotificationCount = async () => {
    try {
      const response = await axios.get('http://localhost:3010/notificationcount');
      setNotificationCount(response.data.count);
    } catch (error) {
      console.error('Error fetching notifications count:', error);
      setNotificationCount(null); 
    }
   }
   fetchNotificationCount();

  // Function to handle form submission for adding new notifications
  const handleNotifications = async (data: { title: string; description: string; brand:string;}) => {
    try {
      setErrorMessage('');
      const response = await axios.post('http://localhost:3010/notification', data);
      
      if (response?.data) {
          // Reset the form
          setNotificatonProductData({
              title: '',
              description: '',
              brand: ''
          });

          // Fetch updated notifications
          fetchNotifications();
      }
  } catch (error: any) {
      console.log('Error:', error);
      
      if (error.response?.status === 400 && error.response?.data?.message) {
          setErrorMessage(error.response.data.message);
      } else {
          setErrorMessage('An error occurred while registering the notification.');
      }
  }
    if(responseMessage!=''){
      setResponseMessage('')
    }
  
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const isConfirmed = window.confirm('Are you sure you want to delete this notification?');
      if (isConfirmed) {
        await axios.delete(`http://localhost:3010/notification/${notificationId}`);
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleUpdate = async (notificationId: string) => {
    try {
      await axios.patch(`http://localhost:3010/notification/${notificationId}`, editFormData);
      fetchNotifications();
      setEditingNotificationId(null);
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  const startEditing = (notification: Item | null) => {
    setEditingNotificationId(notification?._id || null);
    setEditFormData({
      title: notification ? notification.title : '',
    });
  };
  const totalPages = Math.ceil(notifications.length / notificationsPerPage);
  const indexOfLastProduct = currentPage * notificationsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - notificationsPerPage;
  const currentNotifications = notifications.slice(indexOfFirstProduct, indexOfLastProduct);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  
    // Adjust visible page range
    if (newPage > visiblePageRange[1]) {
      setVisiblePageRange([newPage, newPage + 4]); // Move to the next range
    } else if (newPage < visiblePageRange[0]) {
      setVisiblePageRange([newPage - 4, newPage]); // Move to the previous range
    }
  };
  
  const handleNextPageRange = () => {
    if (visiblePageRange[1] < totalPages) {
      setVisiblePageRange([visiblePageRange[0] + 5, visiblePageRange[1] + 5]);
    }
  };

  const handlePrevPageRange = () => {
    if (visiblePageRange[0] > 1) {
      setVisiblePageRange([visiblePageRange[0] - 5, visiblePageRange[1] - 5]);
    }
  };

  const renderPageButtons = () => {
    const pageNumbers = Array.from({ length: Math.min(5, totalPages - visiblePageRange[0] + 1) }, (_, i) => visiblePageRange[0] + i);
    return pageNumbers.map((pageNumber) => (
      <button
        key={pageNumber}
        onClick={() => handlePageChange(pageNumber)}
        className={`px-3 py-1 border ${currentPage === pageNumber ? 'bg-blue-500 text-white' : 'bg-white text-blue-500'}`}
      >
        {pageNumber}
      </button>
    ));
  };
  return (
    <Card>
      <div className="p-6 flex max-w-[900px] w-full gap-16 h-full">
        <div className="form_data sticky h-[435px] top-0 border-solid border border-[#000] p-5">
        {notificationcount !== null && (
        <p className='mb-2'>Notification Count: {notificationcount}</p>
      )}
          {/* FormComponent for adding notifications */}
          <FormComponent formType="notification" onSubmit={handleNotifications} />
        </div>
        <div className="flex-1 border-solid border border-[#000]">
        <div className="list_users overflow-auto p-5 h-full">
         <div className='flex items-center'>
          <h3 className="text-xl font-semibold mb-4">Registered Notifications</h3>
          <SearchComponent searchTerm={searchTerm} setSearchTerm={setSearchTerm} onSearch={fetchNotifications} />
          </div>
          <DynamicList<Notification>
            items={currentNotifications}
            editingItemId={editingNotificationId}
            editFormData={editFormData}
            handleEditChange={handleEditChange}
            handleUpdate={handleUpdate}
            handleDelete={handleDelete}
            startEditing={startEditing}
            placeholder="Enter title"
            type="notification"
          />
         {totalPages > 1 && (
            <div className="mt-4 flex justify-center items-center gap-2">
              <button
                disabled={currentPage === 0}
                onClick={handlePrevPageRange}
                className={`px-3 py-1 ${visiblePageRange[0] === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Prev
              </button>

              {renderPageButtons()}

              <button
                disabled={currentPage === totalPages}
                onClick={handleNextPageRange}
                className={`px-3 py-1 ${visiblePageRange[1] >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Next
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </Card>
  );
}
