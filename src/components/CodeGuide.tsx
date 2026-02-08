import React, { useState } from 'react';

interface CodeGuideProps {
    onBack: () => void;
    currentProjectName?: string;
}

interface GCodeData {
    code: string;
    name: string;
    desc: string;
    example: string;
}

const CodeGuide: React.FC<CodeGuideProps> = ({ onBack, currentProjectName = "Components" }) => {
    const [machineType, setMachineType] = useState<'Lathe' | 'Mill'>('Lathe');

    const commonGCodes: GCodeData[] = [
        { code: 'G0', name: 'Rapid Positioning', desc: 'Moves the tool to a position at maximum speed.', example: 'G0 X10 Y20 Z5' },
        { code: 'G1', name: 'Linear Interpolation', desc: 'Moves the tool in a straight line at a set feed rate.', example: 'G1 X10 Y20 F100' },
        { code: 'G2', name: 'Circular Interpolation (CW)', desc: 'Moves in an arc clockwise.', example: 'G2 X10 Y20 I5 J0' },
        { code: 'G3', name: 'Circular Interpolation (CCW)', desc: 'Moves in an arc counter-clockwise.', example: 'G3 X5 Y5 R5' },
        { code: 'G4', name: 'Dwell', desc: 'Pauses the machine for a specified time (P).', example: 'G4 P1.5' },
        { code: 'G10', name: 'Coordinate System Setting', desc: 'Sets tool table or work coordinate offsets.', example: 'G10 L2 P1 X0 Y0' },
        { code: 'G20', name: 'Inches', desc: 'Sets units to Inches.', example: 'G20' },
        { code: 'G21', name: 'Millimeters', desc: 'Sets units to Millimeters.', example: 'G21' },
        { code: 'G28/G30', name: 'Return to Home', desc: 'Moves to the reference point (Home).', example: 'G28' },
        { code: 'G40', name: 'Cutter Compensation Off', desc: 'Turns off cutter radius compensation.', example: 'G40' },
        { code: 'G41/G42', name: 'Cutter Compensation', desc: 'Compensates for tool radius (Left/Right).', example: 'G41' },
        { code: 'G53', name: 'Machine Coordinates', desc: 'Moves to absolute machine coordinates (non-modal).', example: 'G53 G0 X0 Y0' },
        { code: 'G54-G59', name: 'Work Coordinate Systems', desc: 'Selects work coordinate system 1 through 6.', example: 'G54' },
        { code: 'G61/G64', name: 'Path Control Mode', desc: 'Exact stop check (G61) or continuous path (G64).', example: 'G64' },
        { code: 'G90', name: 'Absolute Positioning', desc: 'Coordinates are relative to the origin.', example: 'G90' },
        { code: 'G91', name: 'Incremental Positioning', desc: 'Coordinates are relative to the current position.', example: 'G91' },
        { code: 'G92', name: 'Coordinate System Offset', desc: 'Sets current position to specified value.', example: 'G92 X0 Y0 Z0' },
        { code: 'G93/G94', name: 'Feed Rate Mode', desc: 'Inverse time (G93) or units per minute (G94).', example: 'G94' },
    ];

    const latheGCodes: GCodeData[] = [
        ...commonGCodes,
        { code: 'G18', name: 'XZ Plane Selection', desc: 'Selects the XZ plane for arcs (Standard for Lathe).', example: 'G18' },
    ];

    const millGCodes: GCodeData[] = [
        ...commonGCodes,
        { code: 'G17', name: 'XY Plane Selection', desc: 'Selects the XY plane (Standard for Mill).', example: 'G17' },
        { code: 'G19', name: 'YZ Plane Selection', desc: 'Selects the YZ plane.', example: 'G19' },
        { code: 'G43', name: 'Tool Length Offset', desc: 'Applies tool length compensation.', example: 'G43 H1' },
        { code: 'G49', name: 'Cancel Tool Offset', desc: 'Cancels tool length compensation.', example: 'G49' },
        { code: 'G98/G99', name: 'Canned Cycle Return', desc: 'Return to initial level (G98) or R point (G99).', example: 'G98' },
    ];

    const commonMCodes: GCodeData[] = [
        { code: 'M0/M1', name: 'Program Stop', desc: 'Pauses the program (M1 is optional).', example: 'M0' },
        { code: 'M2/M30', name: 'Program End', desc: 'Ends the program (M30 resets to start).', example: 'M30' },
        { code: 'M3/M4', name: 'Spindle On', desc: 'Starts the spindle (Clockwise/Counter-Clockwise).', example: 'M3 S1200' },
        { code: 'M5', name: 'Spindle Stop', desc: 'Stops the spindle.', example: 'M5' },
        { code: 'M6', name: 'Tool Change', desc: 'Changes the tool (T).', example: 'M6 T1' },
        { code: 'M7/M8', name: 'Coolant On', desc: 'Turns on coolant (Mist/Flood).', example: 'M8' },
        { code: 'M9', name: 'Coolant Off', desc: 'Turns off all coolant.', example: 'M9' },
        { code: 'M82/M83', name: 'Extruder Mode', desc: 'Absolute/Relative mode for 3D printer extruder.', example: 'M82' },
        { code: 'M104/M109', name: 'Hotend Temp', desc: 'Sets hotend temperature (M109 waits).', example: 'M104 S200' },
    ];

    const activeGCodes = machineType === 'Lathe' ? latheGCodes : millGCodes;
    const activeMCodes = commonMCodes;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            overflow: 'hidden'
        }}>
            {/* Custom Top Bar for Code Guide */}
            <div style={{
                height: '60px',
                backgroundColor: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 2rem',
                justifyContent: 'space-between',
                flexShrink: 0,
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button
                        onClick={onBack}
                        style={{
                            backgroundColor: 'var(--accent-color)',
                            border: 'none',
                            color: '#fff',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 700,
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                        onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
                    >
                        <span className="icon-reply" style={{ fontSize: '1.2rem' }}></span>
                        Back to Simulation
                    </button>
                    <div style={{
                        height: '32px',
                        width: '1px',
                        backgroundColor: 'var(--border-color)'
                    }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Project</span>
                        <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{currentProjectName}</span>
                    </div>
                </div>

                <div style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    textAlign: 'center'
                }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: '1.6rem',
                        fontWeight: 900,
                        background: 'linear-gradient(45deg, var(--accent-color), #60a5fa)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-1px',
                        textTransform: 'uppercase'
                    }}>G-Code Reference</h1>
                </div>

                <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-tertiary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <button
                        onClick={() => setMachineType('Lathe')}
                        style={{
                            backgroundColor: machineType === 'Lathe' ? 'var(--accent-color)' : 'transparent',
                            color: machineType === 'Lathe' ? '#fff' : 'var(--text-primary)',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 20px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Lathe
                    </button>
                    <button
                        onClick={() => setMachineType('Mill')}
                        style={{
                            backgroundColor: machineType === 'Mill' ? 'var(--accent-color)' : 'transparent',
                            color: machineType === 'Mill' ? '#fff' : 'var(--text-primary)',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 20px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Mill
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '2rem',
                display: 'flex',
                gap: '2rem',
                justifyContent: 'center'
            }}>
                <div style={{ flex: 1, maxWidth: '800px' }}>
                    <div style={{ display: 'grid', gap: '15px' }}>
                        <h2 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>G Codes</h2>
                        {activeGCodes.map((item) => (
                            <div key={item.code} style={{
                                backgroundColor: 'var(--bg-secondary)',
                                padding: '15px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                boxShadow: 'var(--shadow-sm)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                                    <h3 style={{ margin: 0, color: 'var(--accent-color)' }}>{item.code}</h3>
                                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                                </div>
                                <p style={{ margin: '5px 0 10px 0', color: 'var(--text-secondary)' }}>{item.desc}</p>
                                <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '8px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                    Example: <span style={{ color: '#ce9178' }}>{item.example}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1, maxWidth: '800px' }}>
                    <div style={{ display: 'grid', gap: '15px' }}>
                        <h2 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>M Codes</h2>
                        {activeMCodes.map((item) => (
                            <div key={item.code} style={{
                                backgroundColor: 'var(--bg-secondary)',
                                padding: '15px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                boxShadow: 'var(--shadow-sm)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                                    <h3 style={{ margin: 0, color: 'var(--accent-color)' }}>{item.code}</h3>
                                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                                </div>
                                <p style={{ margin: '5px 0 10px 0', color: 'var(--text-secondary)' }}>{item.desc}</p>
                                <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '8px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                    Example: <span style={{ color: '#ce9178' }}>{item.example}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeGuide;
