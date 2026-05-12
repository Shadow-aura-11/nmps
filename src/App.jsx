import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Academics from './pages/Academics'
import Admissions from './pages/Admissions'
import Faculty from './pages/Faculty'
import StudentCorner from './pages/StudentCorner'
import MandatoryDisclosure from './pages/MandatoryDisclosure'
import Gallery from './pages/Gallery'
import Contact from './pages/Contact'
import AdminCMS from './pages/AdminCMS'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function PublicLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <PublicLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/academics" element={<Academics />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/student-corner" element={<StudentCorner />} />
          <Route path="/mandatory-disclosure" element={<MandatoryDisclosure />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/web-admin" element={<AdminCMS />} />
          {/* Redirect ERP routes to the standalone portal if accessed */}
          <Route path="/erp/*" element={<div style={{ padding: 100, textAlign: 'center' }}>
            <h2>ERP has moved!</h2>
            <p>The ERP portal is now hosted separately for better security and performance.</p>
            <a href="https://erp.newmorningstar.edu.in" className="btn btn-primary" style={{ marginTop: 20 }}>Go to ERP Portal</a>
          </div>} />
        </Routes>
      </PublicLayout>
    </>
  )
}
