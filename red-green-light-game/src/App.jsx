import { useEffect, useRef, useState } from 'react';
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import SHA256 from 'crypto-js/sha256';

export default function App() {
  const account = useCurrentAccount();
  const signAndExecute = useSignAndExecuteTransaction();

  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('green');
  const [caughtMoving, setCaughtMoving] = useState(false);
  const [victory, setVictory] = useState(false);
  const [statusText, setStatusText] = useState('Green Light');
  const [statusColor, setStatusColor] = useState('green');
  const [gameStarted, setGameStarted] = useState(false);

  const player = useRef({ x: 100, y: 500, width: 40, height: 60, speed: 3 });
  const keys = useRef({});
  const lastSwitchTime = useRef(0);
  const nextSwitchDelay = useRef(0);
  const animationRef = useRef(null);
  const moveHistory = useRef([]);
  const hasMovedOnRed = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleKeyDown = (e) => (keys.current[e.key] = true);

    const handleKeyUp = (e) => (keys.current[e.key] = false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    function switchState() {
      const newState = gameState === 'green' ? 'red' : 'green';
      setGameState(newState);
      setStatusText(`${newState.charAt(0).toUpperCase() + newState.slice(1)} Light`);
      setStatusColor(newState === 'green' ? 'green' : 'red');
      lastSwitchTime.current = performance.now();
      nextSwitchDelay.current = 1000 + Math.random() * 4000;
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
      if (performance.now() - lastSwitchTime.current > nextSwitchDelay.current) {
        switchState();
      }

      let moved = false;

      if (keys.current['ArrowUp']) { player.current.y -= player.current.speed; moved = true; }
      if (keys.current['ArrowDown']) { player.current.y += player.current.speed; moved = true; }
      if (keys.current['ArrowLeft']) { player.current.x -= player.current.speed; moved = true; }
      if (keys.current['ArrowRight']) { player.current.x += player.current.speed; moved = true; }

      if (gameState === 'red' && moved) {
        setCaughtMoving(true);
        submitGame();
      }

      if (player.current.y <= 0) {
        setVictory(true);
        submitGame();
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

    if (gameStarted) {
      lastSwitchTime.current = performance.now();
      nextSwitchDelay.current = 1000 + Math.random() * 4000;
      animationRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, caughtMoving, victory, gameStarted]);

  const submitGame = async () => {
    const moves = moveHistory.current;
    const movesHash = SHA256(JSON.stringify(moves)).toString();

    const tx = new Transaction();
    tx.moveCall({
      target: '0x19d75625474b9a15a0104497498e541734e1419907311d1276b119ea17f90357::game::submit_game',
      arguments: [
        tx.pure(Boolean(victory), 'bool'),
        tx.pure(String(movesHash), 'string')
      ]
    });

    try {
      const result = await signAndExecute.mutateAsync({ transaction: tx });
      console.log('Game submitted to blockchain', result);
    } catch (e) {
      console.error('Submit failed:', e);
    }
  };

  const startOrResetGame = async () => {
    if (!account) return alert('Connect your wallet');

    try {
        const tx = new Transaction();
        tx.setSender(account.address);
        tx.setGasBudget(100000000);
        await signAndExecute.mutateAsync({ transaction: tx });

        player.current.x = 100;
        player.current.y = 500;
        setCaughtMoving(false);
        setVictory(false);
        setGameState('green');
        setStatusText('Green Light');
        setStatusColor('green');
        setGameStarted(true);
        moveHistory.current = [];
        keys.current = {};
    } catch (e) {
        console.error('Game start failed:', e);
    }
  };

  return (
    <div>
      <div style={{ position: 'absolute', top: 10, right: 10, textAlign: 'center' }}>
        <ConnectButton />
        {account ? <p>Wallet Connected!</p> : <p>Not Connected</p>}
      </div>
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
      {(!gameStarted || caughtMoving || victory) && (
        <button
          style={{
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
          onClick={startOrResetGame}
        >
          {gameStarted ? 'Play Again (Sign TX)' : 'Start Game (Sign TX)'}
        </button>
      )}
      <canvas ref={canvasRef} width={800} height={600} style={{ display: 'block', background: '#cce5ff' }} />
    </div>
  );
}
