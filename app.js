// Page 1: Room Creation/Joining
if (document.getElementById('createRoom')) {
  document.getElementById('createRoom').addEventListener('click', () => {
    const name = document.getElementById('playerName').value.trim();
    if (!name) return alert('Please enter your name');

    const roomId = Math.floor(100000 + Math.random() * 900000);
    const roomData = {
      roomId: roomId,
      createdAt: Date.now(),
      player1: { name: name, balance: 3000 },
      player2: null
    };

    database.ref('rooms/' + roomId).set(roomData).then(() => {
      localStorage.setItem('roomId', roomId);
      localStorage.setItem('playerName', name);
      localStorage.setItem('playerRole', 'player1');
      window.location.href = 'game.html';
    });
  });

  document.getElementById('joinRoom').addEventListener('click', () => {
    const name = document.getElementById('playerName').value.trim();
    if (!name) return alert('Please enter your name');

    const roomId = prompt('Enter Room ID:');
    if (!roomId) return;

    database.ref('rooms/' + roomId).once('value').then(snapshot => {
      if (!snapshot.exists()) {
        alert('Room does not exist!');
        return;
      }

      const room = snapshot.val();
      if (room.player2) {
        alert('Room is full!');
        return;
      }

      database.ref('rooms/' + roomId + '/player2').set({
        name: name,
        balance: 3000
      }).then(() => {
        localStorage.setItem('roomId', roomId);
        localStorage.setItem('playerName', name);
        localStorage.setItem('playerRole', 'player2');
        window.location.href = 'game.html';
      });
    });
  });
}

// Page 2: Game Logic
if (document.getElementById('balanceAmount')) {
  const roomId = localStorage.getItem('roomId');
  const playerName = localStorage.getItem('playerName');
  const playerRole = localStorage.getItem('playerRole');
  const opponentRole = playerRole === 'player1' ? 'player2' : 'player1';

  let selectedAmount = 0;
  let lastTransaction = null;

  document.getElementById('playerNameDisplay').textContent = playerName;
  document.getElementById('roomIdDisplay').textContent = roomId;

  // Real-time balance sync
  database.ref('rooms/' + roomId).on('value', snapshot => {
    const room = snapshot.val();
    if (room) {
      document.getElementById('balanceAmount').textContent = room[playerRole].balance;
      if (room[opponentRole]) {
        document.getElementById('opponentName').textContent = room[opponentRole].name;
      }
    }
  });

  // Amount button selection
  document.querySelectorAll('.amount-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedAmount = parseInt(btn.dataset.amount);
      document.querySelectorAll('.amount-btn').forEach(b => b.style.opacity = '0.5');
      btn.style.opacity = '1';
    });
  });

  // Send to Bank
  document.getElementById('sendToBank').addEventListener('click', () => {
    if (selectedAmount === 0) return alert('Select an amount');
    
    database.ref('rooms/' + roomId + '/' + playerRole + '/balance').once('value').then(snap => {
      const currentBalance = snap.val();
      const newBalance = currentBalance - selectedAmount;
      
      lastTransaction = { type: 'bank', amount: selectedAmount, oldBalance: currentBalance };
      
      database.ref('rooms/' + roomId + '/' + playerRole + '/balance').set(newBalance);
      selectedAmount = 0;
    });
  });

  // Send to Player
  document.getElementById('sendToPlayer').addEventListener('click', () => {
    if (selectedAmount === 0) return alert('Select an amount');
    
    database.ref('rooms/' + roomId).once('value').then(snapshot => {
      const room = snapshot.val();
      const currentBalance = room[playerRole].balance;
      const opponentBalance = room[opponentRole].balance;
      
      lastTransaction = { 
        type: 'player', 
        amount: selectedAmount, 
        oldBalance: currentBalance, 
        oldOpponentBalance: opponentBalance 
      };
      
      database.ref('rooms/' + roomId + '/' + playerRole + '/balance').set(currentBalance - selectedAmount);
      database.ref('rooms/' + roomId + '/' + opponentRole + '/balance').set(opponentBalance + selectedAmount);
      selectedAmount = 0;
    });
  });

  // Undo
  document.getElementById('undoBtn').addEventListener('click', () => {
    if (!lastTransaction) return alert('No transaction to undo');
    
    database.ref('rooms/' + roomId + '/' + playerRole + '/balance').set(lastTransaction.oldBalance);
    if (lastTransaction.type === 'player') {
      database.ref('rooms/' + roomId + '/' + opponentRole + '/balance').set(lastTransaction.oldOpponentBalance);
    }
    lastTransaction = null;
  });

  // Reset
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Reset balance to ₹3000?')) {
      database.ref('rooms/' + roomId + '/' + playerRole + '/balance').set(3000);
    }
  });

  // Refresh
  document.getElementById('refreshBtn').addEventListener('click', () => {
    location.reload();
  });

  // Leave Room
  document.getElementById('leaveRoom').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
  });
}

// Auto-delete rooms older than 24 hours
function cleanOldRooms() {
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  database.ref('rooms').once('value').then(snapshot => {
    snapshot.forEach(room => {
      if (room.val().createdAt < oneDayAgo) {
        database.ref('rooms/' + room.key).remove();
      }
    });
  });
}