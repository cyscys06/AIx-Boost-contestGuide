import { NavLink } from 'react-router-dom'
import './Header.css'

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <NavLink to="/" className="header-logo">
            <span className="logo-text">KSNU</span>
            <span className="logo-tagline">AIX-Boost</span>
          </NavLink>
        </div>
        
        <nav className="header-nav">
          <NavLink 
            to="/" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            end
          >
            홈
          </NavLink>
          <NavLink 
            to="/analyze" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            AI 분석
          </NavLink>
          <NavLink 
            to="/contests" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            내 공모전
          </NavLink>
          <NavLink 
            to="/schedule" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            일정
          </NavLink>
          <NavLink 
            to="/recommendations" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            전체 공모전
          </NavLink>
        </nav>
        
        <div className="header-actions">
          <NavLink 
            to="/profile" 
            className={({ isActive }) => `header-profile ${isActive ? 'active' : ''}`}
          >
            프로필
          </NavLink>
        </div>
      </div>
    </header>
  )
}

export default Header
