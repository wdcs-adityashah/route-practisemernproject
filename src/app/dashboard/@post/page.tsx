'use client';
import { useState, useRef,useEffect } from 'react';
import Card from '@/components/card';
import axios from 'axios';
import { FaTrashAlt } from 'react-icons/fa';
import { FaRegPenToSquare } from 'react-icons/fa6';
import FormComponent from '@/components/FormComponent';
import { Item } from '@/types';
import DynamicList from '@/components/DynamicList';
import { useRouter,useSearchParams } from 'next/navigation';
import SearchComponent from '@/components/SearchComponent';

interface Post extends Item {
  _id: string;
  title: string; 
}
export default function Posts() {
  const [postData, setPostData] = useState({ title: '', body: '' });
  const [editFormData, setEditFormData] = useState({ title: '' });
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [posts, setPosts] = useState([]);
  const [postCount, setPostCount] = useState<number | null>(null);
  const router = useRouter();
  const [searchTerm,setSearchTerm] = useState('');
  const searchParams = useSearchParams();
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(4);
  const [visiblePageRange, setVisiblePageRange] = useState([1, 5]); // Controls which pagination buttons are visible

  const fetchPosts = async (querypost='') => {
    try {
      const response = await axios.get(`http://localhost:3010/post?search=${querypost}`);
      setPosts(response.data.length ? response.data : []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchPosts();
    };
    
    fetchData();
  }, []); 
  const fetchPostCount = async () => {
    try {
      const response = await axios.get('http://localhost:3010/postcount');
      setPostCount(response.data.count);
    } catch (error) {
      console.error('Error fetching post count:', error);
      setPostCount(null);
    }
  };
  fetchPostCount()
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  // Handle form submission for new posts
  const handlePost = async (data: { title: string; body: string; }) => {
    console.log("heyy")
    try {
      setErrorMessage('');
      const response = await axios.post('http://localhost:3010/post', data);
      console.log(response,"response")
      if (response?.data) {
        setPostData({ title: '', body: '' });
        fetchPosts();
        console.log('Navigating to: /complex-dashboard/post');
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
    
  };

  // Update a post
  const handleUpdate = async (postId: string) => {
    try {
      await axios.patch(`http://localhost:3010/post/${postId}`, editFormData);
      fetchPosts(); // Refresh posts after update
      setEditingPostId(null);
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  // Start editing a post
  const startEditing = (post: any) => {
    setEditingPostId(post._id);
    setEditFormData({ title: post.title });
  };

  // Delete a post
  const handleDelete = async (postId: string) => {
    try {
      const isConfirmed = window.confirm('Are you sure you want to delete the post?');
      if (isConfirmed) {
        await axios.delete(`http://localhost:3010/post/${postId}`);
        fetchPosts(); 
        fetchPostCount();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const totalPages = Math.ceil(posts.length / postsPerPage);
  const indexOfLastProduct = currentPage * postsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstProduct, indexOfLastProduct);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  
    // Adjust visible page range
    if (newPage > visiblePageRange[1]) {
      const newStart = Math.min(newPage, totalPages - 4); // Ensure you don't go beyond total pages
      const newEnd = Math.min(newPage + 4, totalPages);
      setVisiblePageRange([newStart, newEnd]); // Move to the next range
    } else if (newPage < visiblePageRange[0]) {
      const newStart = Math.max(newPage - 4, 1); // Ensure you don't go below page 1
      const newEnd = Math.max(newPage, 5); // Adjust end accordingly
      setVisiblePageRange([newStart, newEnd]); // Move to the previous range
    }
  };
  
  const handleNextPageRange = () => {
    if (visiblePageRange[1] < totalPages) {
      setVisiblePageRange([
        Math.min(visiblePageRange[0] + 5, totalPages - 4),
        Math.min(visiblePageRange[1] + 5, totalPages),
      ]);
    }
  };
  
  const handlePrevPageRange = () => {
    if (visiblePageRange[0] > 1) {
      setVisiblePageRange([
        Math.max(visiblePageRange[0] - 5, 1),
        Math.min(visiblePageRange[1] - 5, totalPages),
      ]);
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
        <div className="form_data sticky top-0 border-solid border border-[#000] p-5">
          {postCount !== null && <p className="mb-2">Post Count: {postCount}</p>}
          <FormComponent
            formType="post"
            onSubmit={handlePost}
          />

          {errorMessage && <p className="mt-4 text-center text-lg font-medium text-red-500">{errorMessage}</p>}
        </div>

        <div className="flex-1 border-solid border border-[#000]">
          <div className="list_users overflow-auto p-5 h-full">
            <div className='flex items-center'>
            <h3 className="text-xl font-semibold mb-4">Registered Posts</h3>
            <SearchComponent searchTerm={searchTerm} setSearchTerm={setSearchTerm} onSearch={fetchPosts} />

            </div>
            {currentPosts.length === 0?(
               <p>No posts found</p>
            ):(
              <>
              <DynamicList<Post>
              items={currentPosts}
              editingItemId={editingPostId}
              editFormData={editFormData}
              handleEditChange={handleEditChange}
              handleUpdate={handleUpdate}
              handleDelete={handleDelete}
              startEditing={startEditing}
              placeholder="Enter title"
              type="post"
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
