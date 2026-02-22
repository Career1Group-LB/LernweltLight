import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

// "default export" weil React Router lazy() das so erwartet
export default function LoginPage() {
    // useAuth gibt uns die login-Funktion aus unserem Zustand-Store
    const { login } = useAuth();

    // useNavigate: Hook um programmtisch zu navigieren
    // Flutter-Äquivalent: context.router.replace(CoursesRoute())
    const navigate = useNavigate();

    const handleLogin = () => {
        // PLATZHALTER: Später kommt hier der echte OAuth-Flow
        // (Redirect zum OAuth-Server, Callback, Token-Exchange, etc.)
        login('demo-token-123');
        navigate('/courses');
    };

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#f8f9fa',
            }}
        >
            <div
                style={{
                    backgroundColor: '#fff',
                    padding: '40px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                }}
            >
                <h1 style={{ marginBottom: '8px' }}>Lernwelt</h1>
                <p style={{ color: '#666', marginBottom: '32px' }}>
                    Deine Lernplattform
                </p>
                <button
                    onClick={handleLogin}
                    style={{
                        backgroundColor: '#063844',
                        color: '#fff',
                        border: 'none',
                        padding: '12px 32px',
                        borderRadius: '8px',
                        fontSize: '16px',
                        cursor: 'pointer',
                    }}
                >
                    Demo-Login (Platzhalter)
                </button>
                <p style={{ marginTop: '16px', fontSize: '12px', color: '#999' }}>
                    Echter OAuth-Login folgt wenn Auth-Service steht
                </p>
            </div>
        </div>
    );
}