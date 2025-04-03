// Format date function
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate();
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Load all memos for admin with real-time updates
function loadAllMemos() {
  const memoList = document.getElementById('admin-memo-list');
  
  memoList.innerHTML = '<p>Loading all memos...</p>';
  
  // Set up real-time listener
  db.collection('memos')
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (querySnapshot) => {
        if (querySnapshot.empty) {
          memoList.innerHTML = '<p>No memos have been submitted yet.</p>';
          return;
        }
        
        memoList.innerHTML = '';
        querySnapshot.forEach(doc => {
          const memo = doc.data();
          const memoItem = createMemoElement(doc.id, memo);
          memoList.appendChild(memoItem);
        });
      },
      (error) => {
        memoList.innerHTML = `<p>Error loading memos: ${error.message}</p>`;
        console.error("Memo load error:", error);
      }
    );
}

// Create memo DOM element
function createMemoElement(memoId, memo) {
  const memoItem = document.createElement('div');
  memoItem.className = `memo-item ${memo.status}`;
  memoItem.dataset.id = memoId;
  
  let attachmentHtml = '';
  if (memo.hasAttachment) {
    if (memo.attachmentType.startsWith('image/')) {
      attachmentHtml = `
        <div class="memo-attachment">
          <img src="${memo.attachmentUrl}" alt="${memo.attachmentName}" class="attachment-preview">
          <a href="${memo.attachmentUrl}" target="_blank" class="attachment-link">View Full Image</a>
        </div>`;
    } else {
      attachmentHtml = `
        <div class="memo-attachment">
          <a href="${memo.attachmentUrl}" target="_blank" class="attachment-link">
            <i class="file-icon"></i> Download ${memo.attachmentName}
          </a>
        </div>`;
    }
  }
  
  memoItem.innerHTML = `
    <div class="memo-header">
      <h3>${memo.title}</h3>
      <span class="memo-category">${memo.category}</span>
    </div>
    <div class="memo-meta">
      <p><strong>From:</strong> ${memo.senderName} (${memo.senderEmail})</p>
      <p><strong>Submitted:</strong> <span class="timestamp">${formatDate(memo.createdAt)}</span></p>
      <p><strong>Status:</strong> 
        <span class="status-badge status-${memo.status}">${memo.status}</span>
        <select id="status-${memoId}" onchange="updateStatus('${memoId}', this.value)" class="status-select">
          <option value="pending" ${memo.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="approved" ${memo.status === 'approved' ? 'selected' : ''}>Approved</option>
          <option value="rejected" ${memo.status === 'rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </p>
    </div>
    <div class="memo-content">
      <p>${memo.content}</p>
      ${attachmentHtml}
    </div>
    <div class="memo-actions">
      <button onclick="deleteMemo('${memoId}')" class="delete-btn">Delete</button>
    </div>
  `;
  
  return memoItem;
}
// Update memo status
function updateStatus(memoId, newStatus) {
  db.collection('memos').doc(memoId).update({
    status: newStatus,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    console.log(`Memo ${memoId} status updated to ${newStatus}`);
  })
  .catch((error) => {
    console.error("Error updating memo status:", error);
    alert("Error updating memo status. Please try again.");
    // Revert the select value
    const selectElement = document.getElementById(`status-${memoId}`);
    if (selectElement) {
      const memoItem = document.querySelector(`.memo-item[data-id="${memoId}"]`);
      if (memoItem) {
        const currentStatus = memoItem.querySelector('.memo-status')?.textContent;
        if (currentStatus) {
          selectElement.value = currentStatus.toLowerCase();
        }
      }
    }
  });
}

// Delete memo
function deleteMemo(memoId) {
  if (!confirm('Are you sure you want to delete this memo?')) return;
  
  db.collection('memos').doc(memoId).delete()
    .then(() => {
      console.log(`Memo ${memoId} deleted successfully`);
      // The real-time listener will automatically update the UI
    })
    .catch((error) => {
      console.error("Error deleting memo:", error);
      alert("Error deleting memo. Please try again.");
    });
}

// Initialize admin functionality
function initAdmin() {
  loadAllMemos();
}

// Call init when DOM is loaded
document.addEventListener('DOMContentLoaded', initAdmin);


