import { useEffect, useRef, useState } from 'react';

export default function App() {
  const canvasRef = useRef(null);
  const resetBtnRef = useRef(null);
  const [gameState, setGameState] = useState('green');
  const [caughtMoving, setCaughtMoving] = useState(false);
  const [victory, setVictory] = useState(false);
  const [statusText, setStatusText] = useState('Green Light');
  const [statusColor, setStatusColor] = useState('green');

  const player = useRef({ x: 100, y: 500, width: 40, height: 60, speed: 3 });
  const keys = useRef({});
  const lastSwitchTime = useRef(0);
  const nextSwitchDelay = useRef(0);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const handleKeyDown = (e) => (keys.current[e.key] = true);
    const handleKeyUp = (e) => (keys.current[e.key] = false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    function switchState() {
      const newState = gameState === 'green' ? 'red' : 'green';
      setGameState(newState);
      setStatusText(`${newState.charAt(0).toUpperCase() + newState.slice(1)} Light`);
      setStatusColor(newState === 'green' ? 'green' : 'red');
      lastSwitchTime.current = Date.now();
      nextSwitchDelay.current = 1000 + Math.random() * 4000; // Random 1 to 5 seconds
    }

    function drawPlayer() {
      ctx.fillStyle = 'red';
      ctx.fillRect(player.current.x, player.current.y, player.current.width, player.current.height);
    }

    function drawFinishLine() {
      ctx.fillStyle = 'yellow';
      ctx.fillRect(0, 0, canvas.width, 10);
    }

    function update() {
      if (Date.now() - lastSwitchTime.current > nextSwitchDelay.current) {
        switchState();
      } 

      let moved = false;

      if (keys.current['ArrowUp']) { player.current.y -= player.current.speed; moved = true; }
      if (keys.current['ArrowDown']) { player.current.y += player.current.speed; moved = true; }
      if (keys.current['ArrowLeft']) { player.current.x -= player.current.speed; moved = true; }
      if (keys.current['ArrowRight']) { player.current.x += player.current.speed; moved = true; }

      if (gameState === 'red' && moved) {
        setCaughtMoving(true);
        resetBtnRef.current.style.display = 'block';
      }

      if (player.current.y <= 0) {
        setVictory(true);
        resetBtnRef.current.style.display = 'block';
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawFinishLine();
      drawPlayer();

      if (caughtMoving) {
        ctx.fillStyle = 'black';
        ctx.font = '40px Arial';
        ctx.fillText('You were caught moving!', 200, 300);
      }

      if (victory) {
        ctx.fillStyle = 'green';
        ctx.font = '40px Arial';
        ctx.fillText('You Win!', 300, 300);
      }
    }

    function gameLoop() {
      if (!caughtMoving && !victory) {
        update();
      }
      draw();
      animationRef.current = requestAnimationFrame(gameLoop);
    }

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, caughtMoving, victory]);

  const resetGame = () => {
    player.current.x = 100;
    player.current.y = 500;
    setCaughtMoving(false);
    setVictory(false);
    setGameState('green');
    setStatusText('Green Light');
    setStatusColor('green');
    lastSwitchTime.current = Date.now();
    nextSwitchDelay.current = 2000 + Math.random() * 4000;
    resetBtnRef.current.style.display = 'none';
  };

  return (
    <div>
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          fontSize: 24,
          fontWeight: 'bold',
          color: statusColor
        }}
      >
        {statusText}
      </div>
      <button
        ref={resetBtnRef}
        style={{
          display: 'none',
          position: 'absolute',
          top: 50,
          left: 10,
          padding: '10px 20px',
          fontSize: 16,
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: 5,
          cursor: 'pointer'
        }}
        onClick={resetGame}
      >
        Reset Game
      </button>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ display: 'block', background: '#cce5ff' }}
      />
    </div>
  );
}
