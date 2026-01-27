// ========================================
// PAGE 1: Room Creation/Joining Logic
// ========================================

if (document.getElementById('createRoom')) {
  console.log("📄 Page 1 loaded (index.html)");

  // Create Room Button
  document.getElementById('createRoom').addEventListener('click', () => {
    const name = document.getElementById('playerName').value.trim();
    
    if (!name) {
      alert('Please enter your name');
      return;
    }

    // Generate 6-digit room ID
    const roomId = Math.floor(100000 + Math.random() * 900000);
    
    const roomData = {
      roomId: roomId,
      createdAt: Date.now(),
      player1: { 
        name: name, 
        balance: 3000 
      },
      player2: null
    };

    console.log("🏠 Creating room:", roomId);

    // Save to Firebase
    database.ref('rooms/' + roomId).set(roomData)
      .then(() => {
        console.log("✅ Room created successfully!");
        
        // Save to localStorage
        localStorage.setItem('roomId', roomId);
        localStorage.setItem('playerName', name);
        localStorage.setItem('playerRole', 'player1');
        
        // Redirect to game page
        window.location.href = 'game.html';
      })
      .catch((error) => {
        console.error("❌ Error creating room:", error);
        alert('Error creating room: ' + error.message);
      });
  });

  // Join Room Button
  document.getElementById('joinRoom').addEventListener('click', () => {
    const name = document.getElementById('playerName').value.trim();
    
    if (!name) {
      alert('Please enter your name');
      return;
    }

    const roomId = prompt('Enter 6-digit Room ID:');
    
    if (!roomId) return;

    console.log("🚪 Attempting to join room:", roomId);

    // Check if room exists
    database.ref('rooms/' + roomId).once('value')
      .then(snapshot => {
        if (!snapshot.exists()) {
          alert('Room does not exist! Please check the Room ID.');
          console.error("❌ Room not found:", roomId);
          return;
        }

        const room = snapshot.val();
        
        // Check if room is full
        if (room.player2) {
          alert('Room is full! Only 2 players allowed.');
          console.error("❌ Room is full:", roomId);
          return;
        }

        // Join as player 2
        database.ref('rooms/' + roomId + '/player2').set({
          name: name,
          balance: 3000
        })
        .then(() => {
          console.log("✅ Joined room successfully!");
          
          // Save to localStorage
          localStorage.setItem('roomId', roomId);
          localStorage.setItem('playerName', name);
          localStorage.setItem('playerRole', 'player2');
          
          // Redirect to game page
          window.location.href = 'game.html';
        })
        .catch((error) => {
          console.error("❌ Error joining room:", error);
          alert('Error joining room: ' + error.message);
        });
      })
      .catch((error) => {
        console.error("❌ Error checking room:", error);
        alert('Error checking room: ' + error.message);
      });
  });
}

// ========================================
// PAGE 2: Game Logic
// ========================================

if (document.getElementById('balanceAmount')) {
  console.log("🎮 Page 2 loaded (game.html)");

  const roomId = localStorage.getItem('roomId');
  const playerName = localStorage.getItem('playerName');
  const playerRole = localStorage.getItem('playerRole');
  const opponentRole = playerRole === 'player1' ? 'player2' : 'player1';

  let selectedAmount = 0;
  let lastTransaction = null;

  console.log("Player:", playerName, "| Role:", playerRole, "| Room:", roomId);

  // Display player info
  document.getElementById('playerNameDisplay').textContent = playerName;
  document.getElementById('roomIdDisplay').textContent = roomId;

  // Real-time balance sync
  database.ref('rooms/' + roomId).on('value', snapshot => {
    const room = snapshot.val();
    
    if (room && room[playerRole]) {
      document.getElementById('balanceAmount').textContent = room[playerRole].balance;
      console.log("💰 Balance updated:", room[playerRole].balance);
      
      // Show opponent info
      if (room[opponentRole]) {
        document.getElementById('opponentName').textContent = room[opponentRole].name;
      } else {
        document.getElementById('opponentName').textContent = 'Waiting...';
      }
    }
  });

  // Amount button selection
  document.querySelectorAll('.amount-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedAmount = parseInt(btn.dataset.amount);
      console.log("💵 Selected amount:", selectedAmount);
      
      // Visual feedback
      document.querySelectorAll('.amount-btn').forEach(b => b.style.opacity = '0.5');
      btn.style.opacity = '1';
    });
  });

  // Send to Bank
  document.getElementById('sendToBank').addEventListener('click', () => {
    if (selectedAmount === 0) {
      alert('Please select an amount first!');
      return;
    }
    
    database.ref('rooms/' + roomId + '/' + playerRole + '/balance').once('value')
      .then(snap => {
        const currentBalance = snap.val();
        const newBalance = currentBalance - selectedAmount;
        
        if (newBalance < 0) {
          alert('Insufficient balance!');
          return;
        }
        
        lastTransaction = { 
          type: 'bank', 
          amount: selectedAmount, 
          oldBalance: currentBalance 
        };
        
        database.ref('rooms/' + roomId + '/' + playerRole + '/balance').set(newBalance);
        console.log("🏦 Sent to bank:", selectedAmount);
        
        selectedAmount = 0;
        document.querySelectorAll('.amount-btn').forEach(b => b.style.opacity = '1');
      });
  });

  // Send to Player
  document.getElementById('sendToPlayer').addEventListener('click', () => {
    if (selectedAmount === 0) {
      alert('Please select an amount first!');
      return;
    }
    
    database.ref('rooms/' + roomId).once('value')
      .then(snapshot => {
        const room = snapshot.val();
        
        if (!room[opponentRole]) {
          alert('Waiting for opponent to join!');
          return;
        }
        
        const currentBalance = room[playerRole].balance;
        const opponentBalance = room[opponentRole].balance;
        
        if (currentBalance < selectedAmount) {
          alert('Insufficient balance!');
          return;
        }
        
        lastTransaction = { 
          type: 'player', 
          amount: selectedAmount, 
          oldBalance: currentBalance, 
          oldOpponentBalance: opponentBalance 
        };
        
        // Update both balances
        database.ref('rooms/' + roomId + '/' + playerRole + '/balance').set(currentBalance - selectedAmount);
        database.ref('rooms/' + roomId + '/' + opponentRole + '/balance').set(opponentBalance + selectedAmount);
        
        console.log("👤 Sent to player:", selectedAmount);
        
        selectedAmount = 0;
        document.querySelectorAll('.amount-btn').forEach(b => b.style.opacity = '1');
      });
  });

  // Undo Button
  document.getElementById('undoBtn').addEventListener('click', () => {
    if (!lastTransaction) {
      alert('No transaction to undo!');
      return;
    }
    
    database.ref('rooms/' + roomId + '/' + playerRole + '/balance').set(lastTransaction.oldBalance);
    
    if (lastTransaction.type === 'player') {
      database.ref('rooms/' + roomId + '/' + opponentRole + '/balance').set(lastTransaction.oldOpponentBalance);
    }
    
    console.log("↶ Undo successful");
    lastTransaction = null;
  });

  // Reset Button
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Reset your balance to ₹3000?')) {
      database.ref('rooms/' + roomId + '/' + playerRole + '/balance').set(3000);
      console.log("🔄 Balance reset to 3000");
    }
  });

  // Refresh Button
  document.getElementById('refreshBtn').addEventListener('click', () => {
    location.reload();
  });

  // Leave Room Button
  document.getElementById('leaveRoom').addEventListener('click', () => {
    if (confirm('Leave this room? Data will be saved for 24 hours.')) {
      localStorage.clear();
      window.location.href = 'index.html';
    }
  });
}