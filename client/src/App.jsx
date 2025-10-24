import React from 'react'
import Navbar from './components/Navbar'
import { Routes,Route } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Testimonial from './pages/Testimonial'
import FAQ from './pages/FAQ'
import Providers from './pages/Providers'
import Login from './pages/Login'
import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { checkAuth } from './features/authSlice'
import { Toaster } from 'react-hot-toast'

const App = () => {

  const dispatch=useDispatch();

  useEffect(() => {
    // console.log('App: Starting auth check...')
    dispatch(checkAuth())
  }, [dispatch])


  return (
    <div className=''>

      <Toaster></Toaster>

      <Navbar></Navbar>
      <Routes>
        <Route path='/' element={<Home></Home>}></Route>
        <Route path='/about' element={<About></About>}></Route>
        <Route path='/testimonials' element={<Testimonial></Testimonial>}></Route>
        <Route path='/faq' element={<FAQ></FAQ>}></Route>
        <Route path='/provider' element={<Providers></Providers>}></Route>
        <Route path='/login' element={<Login></Login>}></Route>
      </Routes>
    </div>
  )
}

export default App