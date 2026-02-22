export function Header() {
    return (
        <header
            style={{
                height: '64px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                backgroundColor: '#fff',
            }}
        >
            <span style={{ fontSize: '16px', fontWeight: '500' }}>
                Dashboard
            </span>

            {/* Später: User-Avatar, Logout-Button, Benachrichtigungen */}
            <div>
                {/* Platzhalter */}
            </div>
        </header>
    );
}