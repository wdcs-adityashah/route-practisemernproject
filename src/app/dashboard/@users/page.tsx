'use client';

import { useState,useRef,useEffect } from 'react';
import Card from '@/components/card';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation'
import DynamicList from '@/components/DynamicList'; // Import DynamicList component
import { Item } from '@/types';
import FormComponent from '@/components/FormComponent';
import SearchComponent from '@/components/SearchComponent';

interface User extends Item {
  firstname: string;
  email: string;
  lastname: string;
}
export default function Users() {
  const [formData, setFormData] = useState({
    firstname: '',
    email: '',
    lastname: '',
  });
  const [editFormData, setEditFormData] = useState({
    firstname: '',
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [userCount, setUserCount] = useState<number | null>(null);
  const router = useRouter();
  // const lastUserRef = useRef<HTMLLIElement | null>(null);  // Ref for the last user
  const [searchTerm,setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(4);
  const searchParams = useSearchParams();
  const [visiblePageRange, setVisiblePageRange] = useState([1, 5]); // Controls which pagination buttons are visible
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchUsers = async (query = '') => {
    try {
      const response = await axios.get(`http://localhost:3010/users?search=${query}`);
      setUsers(response.data.length ? response.data : []); // Update users or set empty array
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]); // Clear users if there's an error
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchUsers();
    };
    
    fetchData();
  }, []); // Emp
  const fetchUserCount = async () => {
    try {
      const response = await axios.get('http://localhost:3010/userCount');
      console.log(response.data.count)
      setUserCount(response.data.count);
    } catch (error) {
      console.error('Error fetching post count:', error);
      setUserCount(null);
    }
  };
  fetchUserCount()
  
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (data: { firstname: string; lastname: string; email:string;}) => {
    try {
      setErrorMessage('');
      const response = await axios.post('http://localhost:3010/users', data);

      if (response?.data) {
        const { firstname, lastname, email } = response.data;   
         setFormData({
          firstname: '',
          email: '',
          lastname: '',
        });
      fetchUsers()
      }
    } catch (error: any) {
      console.log('Error:', error);

      if (error.response?.status === 400 && error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('An error occurred while registering the user.');
      }
    }
    if (responseMessage != '') {
      setResponseMessage('');
    }
    // setTimeout(() => {
    //   if (lastUserRef.current) {
    //     lastUserRef.current.scrollIntoView({ behavior: 'smooth' });
    //   }
    // }, 100);
  };
  const handleUpdate = async (userId: string) => {
    try {
      // Make sure you're passing the correct fields
      await axios.patch(`http://localhost:3010/users/${userId}`, editFormData);
      fetchUsers();  // Refresh users list after update
      setEditingUserId(null);  // Exit editing mode
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const startEditing = (user: any) => {
    setEditingUserId(user._id);
    setEditFormData({
      firstname: user.firstname
    });
  };

  const handleDelete = async (userId: string) => {

    try {
      const isConfirmed = window.confirm('Are you sure you want to delete the user?');
      if (isConfirmed) {
        await axios.delete(`http://localhost:3010/users/${userId}`);
        fetchUsers();  // Refresh the list after deletion
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };
  // pagination start
  const totalPages = Math.ceil(users.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

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
        {/* Sticky Form */}
        <div className="form_data sticky top-0  border-solid border border-[#000] p-5">
          {userCount && userCount !== null && <p className="mb-2">User Count: {userCount}</p>}
          <FormComponent formType="user" onSubmit={handleSubmit} />
          {errorMessage && <p className="mt-2 text-center text-lg font-medium text-red-500">{errorMessage}</p>}
        </div>

        {/* Users List */}
        <div className="flex-1 border-solid border border-[#000]">
          <div className="list_users overflow-auto p-5 h-full">
          <div className='flex items-center'>
            <h3 className="text-xl font-semibold mb-4">Registered Users</h3>
            <SearchComponent searchTerm={searchTerm} setSearchTerm={setSearchTerm} onSearch={fetchUsers} />

                      </div>
             {currentUsers.length === 0 ? (
            <p>No users found</p>
          ) : (
            <>
            <DynamicList<User>
              items={currentUsers}
              editingItemId={editingUserId}
              editFormData={editFormData}
              handleEditChange={handleEditChange}
              handleUpdate={handleUpdate}
              handleDelete={handleDelete}
              startEditing={startEditing}
              placeholder="Enter name"
              type="user"
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
                </>
          )}
          </div>  
        </div>
      </div>
    </Card>
  );
}
