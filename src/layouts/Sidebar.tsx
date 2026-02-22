import { NavLink } from 'react-router-dom';

// NavLink ist wie ein normaler Link, hat aber automatisch
// eine "active" CSS-Klasse wenn die URL dem Link entspricht
// → Gut um den aktiven Menüpunkt hervorzuheben
export function Sidebar() {
    return (
        <aside
            style={{
                width: '260px',
                backgroundColor: '#f8f9fa',
                borderRight: '1px solid #e0e0e0',
                padding: '16px',
                // position: fixed würde sie beim Scrollen fixieren – später ergänzen
            }}
        >
            <h2 style={{ marginBottom: '24px', fontSize: '18px' }}>Lernwelt</h2>

            <nav>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>

                    {/* NavLink: Zeigt "/courses" an, navigiert zu /courses */}
                    {/* style callback: Wenn active (= aktuelle Route), andere Farbe */}
                    <li style={{ marginBottom: '8px' }}>
                        <NavLink
                            to="/courses"
                            style={({ isActive }) => ({
                                color: isActive ? '#063844' : '#555',
                                fontWeight: isActive ? 'bold' : 'normal',
                                textDecoration: 'none',
                                display: 'block',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                backgroundColor: isActive ? '#e8f0f2' : 'transparent',
                            })}
                        >
                            Kurse
                        </NavLink>
                    </li>

                    {/* Weitere Nav-Items kommen hier dazu, Feature für Feature */}
                </ul>
            </nav>
        </aside>
    );
}