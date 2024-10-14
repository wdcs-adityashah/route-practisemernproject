'use client';
import { useState,useEffect,useRef } from 'react';
import Card from '@/components/card';
import axios from 'axios';
import FormComponent from '@/components/FormComponent';
import { Item } from '@/types';
import DynamicList from '@/components/DynamicList';
import SearchComponent from '@/components/SearchComponent';
import { useSearchParams } from 'next/navigation'

interface Product extends Item {
  _id: string;
  name: string; 
}
export default function Products() {
  const [productdata, setProductData] = useState({
    name: '',
    cuisine: '',
    caloriesPerServing:''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [productcount, setProductCount] = useState<number | null>(null); // Track the post count
  const [products,setProducts] = useState([]);
  const [searchTerm,setSearchTerm] = useState('');
  const searchParams = useSearchParams();
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [productssPerPage] = useState(4);
  const [visiblePageRange, setVisiblePageRange] = useState([1, 5]); // Controls which pagination buttons are visible

  const fetchProducts = async (productQuery='') => {
    try{
    const response = await axios.get(`http://localhost:3010/product?search=${productQuery}`);
    setProducts(response.data.length ? response.data : []);
    }catch(error){
      console.error('Error fetching users:',error);
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await fetchProducts();
    };
    
    fetchData();
  }, []);
  const fetchProductCount = async () => {
    try {
      const response = await axios.get('http://localhost:3010/productcount');
      setProductCount(response.data.count);
    } catch (error) {
      console.error('Error fetching post count:', error);
      setProductCount(null); 
    }
   }
   fetchProductCount();
  const handleProduct = async (data: { name: string; cuisine: string; caloriesPerServing:number;}) => {
    try {
      setErrorMessage('');
      const response = await axios.post('http://localhost:3010/product',data);
      if(response?.data){
        const {name,cuisine,caloriesPerServing} = response.data;
        setProductData({
          name: '',
          cuisine: '',
          caloriesPerServing:''
        });
        fetchProducts()
      }
      
    } catch (error: any) {
      console.log('Error:', error);
      
      if (error.response?.status === 400 && error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('An error occurred while registering the user.');
      }
    }
    if(responseMessage!=''){
      setResponseMessage('')
    }
  
  };
  const handleDelete = async(productId:string)=>{
    try{
      const IsConfirmed = window.confirm('Are you sure you want to delete the product?');
      if(IsConfirmed){
        await axios.delete(`http://localhost:3010/product/${productId}`);
        fetchProducts()
      }
  
    }catch(error){
      console.error('Error deleting products:', error);
  
    }
  }
  const handleUpdate = async(productId:string) => {
    try {
      await axios.patch(`http://localhost:3010/product/${productId}`,editFormData);
    fetchProducts()
    setEditingProductId(null)
    } catch (error) {
      console.log(error)
    }
    
  }
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };
  const startEditing = (product:any) =>{
    setEditingProductId(product._id);
    setEditFormData({
      name:product.name
    })
  }
  // pagination start
  const totalPages = Math.ceil(products.length / productssPerPage);
  const indexOfLastProduct = currentPage * productssPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productssPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

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
        <div className="form_data sticky top-0  border-solid border border-[#000] p-5">
        {productcount !== null && (
        <p className='mb-2'>Product Count: {productcount}</p>
      )}
      <FormComponent formType="product" onSubmit={handleProduct} />
        {errorMessage && (
          <p className="mt-2 text-center text-lg font-medium text-red-500">{errorMessage}</p>
        )}
      </div>
      <div className='flex-1 border-solid border border-[#000]'>
      <div className="list_users overflow-auto p-5 h-full">
        <div className='flex items-center'>
      <h3 className="text-xl font-semibold mb-4">Registered Products</h3>
      <SearchComponent searchTerm={searchTerm} setSearchTerm={setSearchTerm} onSearch={fetchProducts} />
      </div>
      {currentProducts.length === 0?(
        <p>No Products Found</p>
        ):(
          <>
          <DynamicList<Product>
          items={currentProducts}
          editingItemId={editingProductId}
          editFormData={editFormData}
          handleEditChange={handleEditChange}
          handleUpdate={handleUpdate}
          handleDelete={handleDelete}
          startEditing={startEditing}
          placeholder="Enter name"
          type="product"
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
