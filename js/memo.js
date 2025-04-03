// Initialize Firebase Storage
const storage = firebase.storage();

// Submit memo with file upload
function submitMemo() {
  const title = document.getElementById('memo-title').value;
  const content = document.getElementById('memo-content').value;
  const category = document.getElementById('memo-category').value;
  const file = document.getElementById('memo-file').files[0];
  
  const user = auth.currentUser;
  
  if (!title || !content || !category) {
    document.getElementById('memo-error').textContent = 'Please fill all required fields';
    return;
  }
  
  // Show loading state
  document.getElementById('submit-btn').disabled = true;
  document.getElementById('submit-btn').textContent = 'Submitting...';
  
  // Create memo data object
  const memoData = {
    title: title,
    content: content,
    category: category,
    senderId: user.uid,
    senderName: user.displayName || user.email,
    senderEmail: user.email,
    status: 'pending',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    hasAttachment: false
  };
  
  // Upload file if exists
  if (file) {
    const storageRef = storage.ref(`memo-attachments/${user.uid}/${Date.now()}_${file.name}`);
    const uploadTask = storageRef.put(file);
    
    uploadTask.on('state_changed', 
      (snapshot) => {
        // Progress tracking could be added here
      }, 
      (error) => {
        document.getElementById('memo-error').textContent = 'File upload failed: ' + error.message;
        document.getElementById('submit-btn').disabled = false;
        document.getElementById('submit-btn').textContent = 'Submit Memo';
      }, 
      () => {
        // File uploaded successfully
        uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
          memoData.attachmentUrl = downloadURL;
          memoData.attachmentName = file.name;
          memoData.attachmentType = file.type;
          memoData.hasAttachment = true;
          
          // Save memo to Firestore
          saveMemoToFirestore(memoData);
        });
      }
    );
  } else {
    // Save memo without attachment
    saveMemoToFirestore(memoData);
  }
}

function saveMemoToFirestore(memoData) {
  db.collection('memos').add(memoData)
    .then(() => {
      document.getElementById('memo-form').reset();
      document.getElementById('memo-success').textContent = 'Memo submitted successfully!';
      document.getElementById('submit-btn').disabled = false;
      document.getElementById('submit-btn').textContent = 'Submit Memo';
      setTimeout(() => {
        document.getElementById('memo-success').textContent = '';
      }, 3000);
      loadUserMemos();
    })
    .catch(error => {
      document.getElementById('memo-error').textContent = error.message;
      document.getElementById('submit-btn').disabled = false;
      document.getElementById('submit-btn').textContent = 'Submit Memo';
    });
}

// Load user's memos with attachments
function loadUserMemos() {
  const user = auth.currentUser;
  const memoList = document.getElementById('memo-list');
  
  memoList.innerHTML = '<p>Loading your memos...</p>';
  
  db.collection('memos')
    .where('senderId', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .get()
    .then(querySnapshot => {
      if (querySnapshot.empty) {
        memoList.innerHTML = '<p>You have not submitted any memos yet.</p>';
        return;
      }
      
      memoList.innerHTML = '';
      querySnapshot.forEach(doc => {
        const memo = doc.data();
        const memoItem = document.createElement('div');
        memoItem.className = 'memo-item';
        
        let attachmentHtml = '';
        if (memo.hasAttachment) {
          if (memo.attachmentType.startsWith('image/')) {
            attachmentHtml = `<div class="memo-attachment">
              <img src="${memo.attachmentUrl}" alt="${memo.attachmentName}" class="attachment-preview">
              <a href="${memo.attachmentUrl}" target="_blank">View Image</a>
            </div>`;
          } else {
            attachmentHtml = `<div class="memo-attachment">
              <a href="${memo.attachmentUrl}" target="_blank">Download ${memo.attachmentName}</a>
            </div>`;
          }
        }
        
        memoItem.innerHTML = `
          <h3>${memo.title}</h3>
          <p><strong>Category:</strong> ${memo.category}</p>
          <p><strong>Status:</strong> <span class="status-${memo.status}">${memo.status}</span></p>
          <p>${memo.content}</p>
          ${attachmentHtml}
          <p class="timestamp">Submitted: ${formatDate(memo.createdAt)}</p>
        `;
        memoList.appendChild(memoItem);
      });
    })
    .catch(error => {
      memoList.innerHTML = `<p>Error loading memos: ${error.message}</p>`;
    });
}