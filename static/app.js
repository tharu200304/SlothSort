/* ==============================================================================
   SlothSort: Modern Vanilla JS Client Application (Enhanced)
============================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // DOM References
  const aiStatusBadge = document.getElementById('aiStatusBadge');
  const aiStatusDot = document.getElementById('aiStatusDot');
  const aiStatusText = document.getElementById('aiStatusText');

  const presetSelect = document.getElementById('presetSelect');
  const modelSelect = document.getElementById('modelSelect');

  const btnToggleGuide = document.getElementById('btnToggleGuide');
  const btnCloseGuide = document.getElementById('btnCloseGuide');
  const guideBanner = document.getElementById('guideBanner');

  const metricInboxCount = document.getElementById('metricInboxCount');
  const metricInboxDesc = document.getElementById('metricInboxDesc');
  const metricVaultCount = document.getElementById('metricVaultCount');
  const metricEngine = document.getElementById('metricEngine');

  const inboxBadge = document.getElementById('inboxBadge');
  const vaultBadge = document.getElementById('vaultBadge');
  const auditCountBadge = document.getElementById('auditCountBadge');
  const inboxPathDisplay = document.getElementById('inboxPathDisplay');
  const vaultPathDisplay = document.getElementById('vaultPathDisplay');

  const btnSort = document.getElementById('btnSort');
  const btnPreview = document.getElementById('btnPreview');
  const btnUndo = document.getElementById('btnUndo');
  const btnSeed = document.getElementById('btnSeed');

  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');

  const inboxFileList = document.getElementById('inboxFileList');
  const vaultCategoryList = document.getElementById('vaultCategoryList');
  const searchInput = document.getElementById('searchInput');
  const categoryFilterBar = document.getElementById('categoryFilterBar');

  const consoleLogs = document.getElementById('consoleLogs');
  const btnClearLogs = document.getElementById('btnClearLogs');
  const consoleDrawer = document.getElementById('consoleDrawer');
  const consoleToggleHeader = document.getElementById('consoleToggleHeader');
  const consoleLatestTicker = document.getElementById('consoleLatestTicker');
  const btnToggleConsole = document.getElementById('btnToggleConsole');

  const previewModal = document.getElementById('previewModal');
  const modalFilename = document.getElementById('modalFilename');
  const modalContent = document.getElementById('modalContent');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalFileMeta = document.getElementById('modalFileMeta');
  const btnModalCopy = document.getElementById('btnModalCopy');
  const btnModalDownload = document.getElementById('btnModalDownload');
  const btnModalMove = document.getElementById('btnModalMove');
  const btnModalRename = document.getElementById('btnModalRename');
  const toastContainer = document.getElementById('toastContainer');

  const vaultTotalSize = document.getElementById('vaultTotalSize');
  const vaultCleanliness = document.getElementById('vaultCleanliness');
  const vaultCategoryCount = document.getElementById('vaultCategoryCount');
  const vaultDistributionBar = document.getElementById('vaultDistributionBar');
  const vaultSortSelect = document.getElementById('vaultSortSelect');
  const btnViewGroup = document.getElementById('btnViewGroup');
  const btnViewList = document.getElementById('btnViewList');
  const btnViewGrid = document.getElementById('btnViewGrid');
  const btnSelectAll = document.getElementById('btnSelectAll');
  const selectAllLabel = document.getElementById('selectAllLabel');

  const batchActionBar = document.getElementById('batchActionBar');
  const batchCountBadge = document.getElementById('batchCountBadge');
  const batchSizeBadge = document.getElementById('batchSizeBadge');
  const btnBatchMove = document.getElementById('btnBatchMove');
  const btnBatchZip = document.getElementById('btnBatchZip');
  const btnBatchDelete = document.getElementById('btnBatchDelete');
  const btnBatchClear = document.getElementById('btnBatchClear');

  const btnOpenAddCategory = document.getElementById('btnOpenAddCategory');

  let currentState = null;
  let activeCategoryFilter = 'all';
  let activeSearchTerm = '';
  let activeSortMode = 'newest';
  let activeViewMode = 'group';
  let selectedVaultPaths = new Set();
  let previewCurrentFile = null;

  // Logging utility
  function appendLog(text, type = 'dim') {
    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = `log-line log-${type}`;
    line.textContent = `[${time}] ${text}`;
    consoleLogs.appendChild(line);
    consoleLogs.scrollTop = consoleLogs.scrollHeight;

    if (consoleLatestTicker) {
      consoleLatestTicker.textContent = `[${time}] ${text}`;
      consoleLatestTicker.className = `console-latest-ticker log-${type}`;
    }
  }

  // Toast notification
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? '✅' : type === 'warn' ? '⚠️' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Format bytes
  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Fetch state from server
  async function refreshState() {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error('Failed to fetch state');
      const data = await res.json();
      currentState = data;
      renderUI(data);
    } catch (err) {
      appendLog(`Error fetching state: ${err.message}`, 'amber');
    }
  }

  // Render full dashboard
  function renderUI(state) {
    // 1. Status Badge & Selectors
    if (state.ollama_online) {
      aiStatusDot.className = 'status-indicator indicator-green';
      aiStatusText.textContent = `Ollama (${state.active_model})`;
      metricEngine.textContent = state.active_model;
      metricEngine.style.color = '#34d399';
    } else {
      aiStatusDot.className = 'status-indicator indicator-amber';
      aiStatusText.textContent = 'Local Heuristic Engine';
      metricEngine.textContent = 'Rule Heuristic';
      metricEngine.style.color = '#fbbf24';
    }

    const customOpt = document.getElementById('customOptionItem');
    if (state.current_preset === 'custom') {
      if (customOpt) {
        customOpt.style.display = 'block';
        customOpt.textContent = `Custom (${state.inbox_path_display})`;
        customOpt.value = 'custom';
      }
      presetSelect.value = 'custom';
    } else {
      presetSelect.value = state.current_preset;
      if (customOpt && state.custom_inbox) {
        customOpt.style.display = 'block';
        customOpt.textContent = `Custom (${state.inbox_path_display})`;
        customOpt.value = 'custom';
      }
    }

    if (modelSelect.value !== state.active_model) {
      modelSelect.value = state.active_model;
    }

    // 2. Metrics & Paths
    metricInboxCount.textContent = state.inbox_count;
    metricVaultCount.textContent = state.sorted_count;
    inboxBadge.textContent = `${state.inbox_count} files`;
    vaultBadge.textContent = `${state.sorted_count} files`;
    auditCountBadge.textContent = `${state.manifest_history.length} audit entries`;

    inboxPathDisplay.textContent = state.inbox_path_display || './messy_inbox';
    vaultPathDisplay.textContent = state.vault_path_display || './organized_vault';
    metricInboxDesc.textContent = `In: ${state.inbox_path_display || './messy_inbox'}`;

    btnUndo.disabled = !state.can_undo;
    btnSort.disabled = state.inbox_count === 0;
    btnPreview.disabled = state.inbox_count === 0;

    // 3. Render Inbox Files with AI Pre-Scan breakdown
    renderInboxFiles(state.inbox_files);

    // 4. Render Vault Files with Filtering and Search
    populateCategoryDropdowns(state.all_categories);
    renderVaultFiles(state.vault_categories);
  }

  // Render Inbox Files
  function renderInboxFiles(files) {
    if (!files || files.length === 0) {
      inboxFileList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📁</div>
          <p>Inbox is sparkling clean! All files organized.</p>
          <button class="btn btn-secondary btn-sm" id="btnEmptySeed">Seed 4 Test Files</button>
        </div>
      `;
      const emptySeedBtn = document.getElementById('btnEmptySeed');
      if (emptySeedBtn) emptySeedBtn.addEventListener('click', handleSeed);
      return;
    }

    inboxFileList.innerHTML = files.map(file => {
      const ext = file.extension ? file.extension.replace('.', '') : 'FILE';
      const tagsHtml = (file.tags || []).slice(0, 2).map(t => `<span class="tag-chip">#${escapeHtml(t)}</span>`).join('');

      return `
        <div class="file-item" title="${escapeHtml(file.name)} • ${escapeHtml(file.reasoning)}">
          <div class="file-top-row">
            <div class="file-info">
              <span class="file-ext">${escapeHtml(ext)}</span>
              <span class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
              <span class="file-meta">${formatBytes(file.size_bytes)}</span>
            </div>
            <button class="mini-btn view-file-btn" data-path="${escapeHtml(file.name)}" title="Inspect file snippet">👁️ View</button>
          </div>

          <div class="pre-scan-subline" title="${escapeHtml(file.reasoning)}">
            <span class="predicted-cat">${escapeHtml(file.predicted_category)}</span>
            <span class="confidence-chip">${escapeHtml(file.confidence)}</span>
            <span class="pre-scan-reason">💡 ${escapeHtml(file.reasoning)}</span>
            ${tagsHtml ? `<div class="subline-tags">${tagsHtml}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Attach preview event listeners
    inboxFileList.querySelectorAll('.view-file-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fname = e.target.getAttribute('data-path');
        const fullPath = currentState ? `${currentState.inbox_path}/${fname}` : fname;
        openPreviewModal(fullPath, fname);
      });
    });
  }

  // Category Icons map
  const categoryIcons = {
    'Invoices & Receipts': '🧾',
    'Banking & Taxes': '💰',
    'Spreadsheets & Data': '📊',
    'Legal & Contracts': '⚖️',
    'Research & Academic': '🎓',
    'Code & Development': '💻',
    'Notes & Ideas': '📝',
    'Personal & Health': '🩺',
    'Media & Images': '🎨',
    'Presentations & Slides': '📽️',
    'E-Books & Manuals': '📚',
    'Travel & Bookings': '✈️',
    'Resumes & Credentials': '📜',
    'Configs & System Logs': '⚙️',
    'Archives & Installers': '📦',
    'Audio & Podcasts': '🎵',
    'Work & Documents': '📁',
    'Miscellaneous': '🗃️'
  };

  const categoryColors = {
    'Invoices & Receipts': '#10b981',
    'Banking & Taxes': '#fbbf24',
    'Spreadsheets & Data': '#06b6d4',
    'Legal & Contracts': '#a855f7',
    'Research & Academic': '#6366f1',
    'Code & Development': '#3b82f6',
    'Notes & Ideas': '#f59e0b',
    'Personal & Health': '#ec4899',
    'Media & Images': '#14b8a6',
    'Presentations & Slides': '#8b5cf6',
    'E-Books & Manuals': '#f97316',
    'Travel & Bookings': '#0284c7',
    'Resumes & Credentials': '#eab308',
    'Configs & System Logs': '#64748b',
    'Archives & Installers': '#6b7280',
    'Audio & Podcasts': '#d946ef',
    'Work & Documents': '#38bdf8',
    'Miscellaneous': '#94a3b8'
  };

  // Update Vault Summary & Distribution Bar
  function updateVaultSummaryStrip(vaultCategories) {
    let totalBytes = 0;
    let totalFiles = 0;
    const catCounts = {};

    Object.keys(vaultCategories || {}).forEach(cat => {
      const files = vaultCategories[cat] || [];
      catCounts[cat] = files.length;
      totalFiles += files.length;
      files.forEach(f => {
        totalBytes += (f.size_bytes || 0);
      });
    });

    if (vaultTotalSize) vaultTotalSize.textContent = `${formatBytes(totalBytes)} Total`;
    if (vaultCleanliness) vaultCleanliness.textContent = totalFiles > 0 ? '100% Automated' : 'Awaiting Files';
    const activeCats = Object.keys(catCounts).filter(c => catCounts[c] > 0);
    if (vaultCategoryCount) vaultCategoryCount.textContent = `${activeCats.length} Categories Active`;

    if (vaultDistributionBar) {
      if (totalFiles === 0) {
        vaultDistributionBar.innerHTML = '<div class="dist-segment" style="width: 100%; background: rgba(255,255,255,0.08);"></div>';
      } else {
        vaultDistributionBar.innerHTML = activeCats.map(cat => {
          const cnt = catCounts[cat];
          const pct = ((cnt / totalFiles) * 100).toFixed(1);
          const color = categoryColors[cat] || '#10b981';
          return `<div class="dist-segment" style="width: ${pct}%; background: ${color};" title="${escapeHtml(cat)}: ${cnt} files (${pct}%)"></div>`;
        }).join('');
      }
    }
  }

  // Update category filter pill count badges
  function updateCategoryPillCounts(vaultCategories) {
    let totalCount = 0;
    const catCounts = {};
    Object.keys(vaultCategories || {}).forEach(cat => {
      const cnt = (vaultCategories[cat] || []).length;
      catCounts[cat] = cnt;
      totalCount += cnt;
    });

    document.querySelectorAll('.cat-pill').forEach(pill => {
      const cat = pill.getAttribute('data-cat');
      if (!cat) return; // e.g. Add Category button
      let baseLabel = pill.getAttribute('data-label') || pill.textContent.split('(')[0].trim();
      pill.setAttribute('data-label', baseLabel);
      if (cat === 'all') {
        pill.textContent = `${baseLabel} (${totalCount})`;
      } else {
        const cnt = catCounts[cat] || 0;
        pill.textContent = `${baseLabel} (${cnt})`;
      }
    });
  }

  // Update floating batch action bar
  function updateBatchBar() {
    if (!batchActionBar) return;
    const count = selectedVaultPaths.size;
    if (count > 0) {
      batchActionBar.style.display = 'flex';
      if (batchCountBadge) batchCountBadge.textContent = `${count} selected`;
      
      // Calculate total size of selected files
      let selectedBytes = 0;
      document.querySelectorAll('.vault-item-checkbox:checked').forEach(cb => {
        selectedBytes += parseInt(cb.getAttribute('data-size') || '0', 10);
      });
      if (batchSizeBadge) batchSizeBadge.textContent = formatBytes(selectedBytes);
      if (selectAllLabel) selectAllLabel.textContent = 'Deselect';
    } else {
      batchActionBar.style.display = 'none';
      if (selectAllLabel) selectAllLabel.textContent = 'Select';
    }
  }

  // Render Vault Categories with Active Filter, Sorting, Layout, and Search
  function renderVaultFiles(vaultCategories) {
    updateVaultSummaryStrip(vaultCategories);
    updateCategoryPillCounts(vaultCategories);

    const categories = Object.keys(vaultCategories || {});
    let allMatchingFiles = [];

    categories.forEach(cat => {
      const files = vaultCategories[cat] || [];
      files.forEach(f => {
        // Apply category filter
        if (activeCategoryFilter !== 'all' && cat.toLowerCase() !== activeCategoryFilter.toLowerCase()) {
          return;
        }

        // Apply text search
        if (activeSearchTerm) {
          const matchTerm = activeSearchTerm.toLowerCase();
          const inName = (f.name || '').toLowerCase().includes(matchTerm);
          const inOrig = (f.original_name || '').toLowerCase().includes(matchTerm);
          const inSummary = (f.summary || '').toLowerCase().includes(matchTerm);
          const inTags = (f.tags || []).some(t => t.toLowerCase().includes(matchTerm));
          if (!inName && !inOrig && !inSummary && !inTags) return;
        }

        allMatchingFiles.push(f);
      });
    });

    // Apply Sorting
    allMatchingFiles.sort((a, b) => {
      if (activeSortMode === 'newest') return (b.modified || '').localeCompare(a.modified || '');
      if (activeSortMode === 'oldest') return (a.modified || '').localeCompare(b.modified || '');
      if (activeSortMode === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (activeSortMode === 'name_desc') return (b.name || '').localeCompare(a.name || '');
      if (activeSortMode === 'size_desc') return (b.size_bytes || 0) - (a.size_bytes || 0);
      return 0;
    });

    // Set view layout class on container
    vaultCategoryList.className = 'file-list';
    if (activeViewMode === 'grid') vaultCategoryList.classList.add('view-grid');
    if (activeViewMode === 'list') vaultCategoryList.classList.add('view-list');

    if (allMatchingFiles.length === 0) {
      vaultCategoryList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <p>${currentState && currentState.sorted_count > 0 ? 'No files match your search filter.' : 'Vault is empty. Click "Sort Now" or "Preview" to organize.'}</p>
        </div>
      `;
      updateBatchBar();
      return;
    }

    // Helper for rendering a file card (Compact Sleek Small Tile)
    function renderFileCard(f) {
      const icon = categoryIcons[f.category] || '📁';
      const isChecked = selectedVaultPaths.has(f.path) ? 'checked' : '';
      const tagsHtml = (f.tags || []).slice(0, 3).map(t => `<span class="tag-chip clickable-tag" data-tag="${escapeHtml(t)}">#${escapeHtml(t)}</span>`).join('');
      const subInfo = f.summary || f.reasoning || f.original_name;

      return `
        <div class="vault-item" data-path="${escapeHtml(f.path)}">
          <div class="vault-item-main">
            <div class="vault-item-left">
              <input type="checkbox" class="vault-item-checkbox" data-path="${escapeHtml(f.path)}" data-size="${f.size_bytes}" ${isChecked} title="Select file for batch operations">
              <span class="vault-item-icon">${icon}</span>
              <span class="vault-item-name" title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</span>
              <span class="vault-item-orig" title="Original: ${escapeHtml(f.original_name)}">(${escapeHtml(f.original_name)})</span>
            </div>
            <div class="vault-item-right">
              <span class="vault-item-meta">${formatBytes(f.size_bytes)}</span>
              <div class="file-actions">
                <button class="mini-btn copy-path-btn" data-path="${escapeHtml(f.path)}" title="Copy portable path">📋</button>
                <button class="mini-btn move-cat-btn" data-path="${escapeHtml(f.path)}" data-name="${escapeHtml(f.name)}" data-current="${escapeHtml(f.category)}" title="Move to another category">🔄</button>
                <button class="mini-btn rename-vault-btn" data-path="${escapeHtml(f.path)}" data-name="${escapeHtml(f.name)}" title="Rename this sorted file">✏️</button>
                <a href="/api/file-download?path=${encodeURIComponent(f.path)}" class="mini-btn download-vault-btn" title="Download file to PC" download>⬇️</a>
                <button class="mini-btn view-vault-btn" data-path="${escapeHtml(f.path)}" data-name="${escapeHtml(f.name)}" data-cat="${escapeHtml(f.category)}" title="Inspect file content or preview image">👁️</button>
                <button class="mini-btn mini-btn-danger delete-vault-btn" data-path="${escapeHtml(f.path)}" data-name="${escapeHtml(f.name)}" title="Delete file from vault">🗑️</button>
              </div>
            </div>
          </div>
          <div class="vault-item-subline" title="Summary: ${escapeHtml(f.summary)} • 💡 ${escapeHtml(f.reasoning)}">
            <span class="subline-reason">💡 ${escapeHtml(subInfo)}</span>
            <div class="subline-tags">${tagsHtml}</div>
          </div>
        </div>
      `;
    }

    if (activeViewMode === 'group') {
      // Group matching files by category
      const grouped = {};
      allMatchingFiles.forEach(f => {
        if (!grouped[f.category]) grouped[f.category] = [];
        grouped[f.category].push(f);
      });

      vaultCategoryList.innerHTML = Object.keys(grouped).map(cat => {
        const files = grouped[cat];
        const icon = categoryIcons[cat] || '📁';
        return `
          <div class="category-group">
            <div class="category-header">
              <span>${icon} ${escapeHtml(cat)}</span>
              <span>${files.length} item${files.length > 1 ? 's' : ''}</span>
            </div>
            ${files.map(renderFileCard).join('')}
          </div>
        `;
      }).join('');
    } else {
      // Flat list or Grid
      vaultCategoryList.innerHTML = allMatchingFiles.map(renderFileCard).join('');
    }

    // Attach checkbox listeners
    vaultCategoryList.querySelectorAll('.vault-item-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const p = e.target.getAttribute('data-path');
        if (e.target.checked) {
          selectedVaultPaths.add(p);
        } else {
          selectedVaultPaths.delete(p);
        }
        updateBatchBar();
      });
    });

    // Attach preview event listeners
    vaultCategoryList.querySelectorAll('.view-vault-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const path = e.currentTarget.getAttribute('data-path');
        const name = e.currentTarget.getAttribute('data-name');
        const cat = e.currentTarget.getAttribute('data-cat');
        openPreviewModal(path, name, cat);
      });
    });

    // Attach copy path listeners
    vaultCategoryList.querySelectorAll('.copy-path-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const path = e.currentTarget.getAttribute('data-path');
        try {
          await navigator.clipboard.writeText(path);
          showToast('Copied path to clipboard!', 'info');
        } catch {
          showToast(`Path: ${path}`, 'info');
        }
      });
    });

    // Attach move category listeners
    vaultCategoryList.querySelectorAll('.move-cat-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const path = e.currentTarget.getAttribute('data-path');
        const name = e.currentTarget.getAttribute('data-name');
        const currentCat = e.currentTarget.getAttribute('data-current');
        openMoveCategoryModal(path, name, currentCat);
      });
    });

    // Attach rename listeners
    vaultCategoryList.querySelectorAll('.rename-vault-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const path = e.currentTarget.getAttribute('data-path');
        const name = e.currentTarget.getAttribute('data-name');
        openRenameModal(path, name);
      });
    });

    // Attach delete listeners
    vaultCategoryList.querySelectorAll('.delete-vault-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const path = e.currentTarget.getAttribute('data-path');
        const name = e.currentTarget.getAttribute('data-name');
        if (confirm(`Are you sure you want to delete '${name}' from the vault?`)) {
          await handleDeleteFile(path, name);
        }
      });
    });

    // Attach clickable tag listeners
    vaultCategoryList.querySelectorAll('.clickable-tag').forEach(tag => {
      tag.addEventListener('click', (e) => {
        const t = e.currentTarget.getAttribute('data-tag');
        searchInput.value = t;
        activeSearchTerm = t;
        renderVaultFiles(currentState ? currentState.vault_categories : {});
      });
    });

    updateBatchBar();
  }

  // Open Enhanced Preview Modal (supports image viewer, text, syntax, actions)
  async function openPreviewModal(path, displayName, category) {
    previewCurrentFile = { path, name: displayName, category };
    modalFilename.textContent = displayName || path;
    modalContent.innerHTML = '<div style="color: var(--text-muted); padding: 12px;">Reading preview...</div>';
    if (modalFileMeta) modalFileMeta.textContent = path;
    if (btnModalDownload) btnModalDownload.href = `/api/file-download?path=${encodeURIComponent(path)}`;
    previewModal.classList.add('active');

    try {
      const res = await fetch(`/api/file-content?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error('Could not read file preview');
      const data = await res.json();
      previewCurrentFile = data;
      modalFilename.textContent = `${data.name}`;
      if (modalFileMeta) modalFileMeta.textContent = `${formatBytes(data.size_bytes)} • ${data.path}`;

      if (data.is_image) {
        modalContent.innerHTML = `
          <div class="media-preview-container">
            <img src="${data.raw_url}" alt="${escapeHtml(data.name)}">
          </div>
          <div style="color: var(--text-muted); font-size: 0.74rem; text-align: center;">Visual image asset rendered directly from local storage.</div>
        `;
      } else {
        modalContent.textContent = data.content || '[Empty file content]';
      }
    } catch (err) {
      modalContent.textContent = `[Error loading preview: ${err.message}]`;
    }
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => previewModal.classList.remove('active'));
  if (previewModal) {
    previewModal.addEventListener('click', (e) => {
      if (e.target === previewModal) previewModal.classList.remove('active');
    });
  }

  // Wire buttons inside preview modal footer
  if (btnModalCopy) {
    btnModalCopy.addEventListener('click', async () => {
      if (!previewCurrentFile || !previewCurrentFile.path) return;
      try {
        await navigator.clipboard.writeText(previewCurrentFile.path);
        showToast('Copied path to clipboard!', 'info');
      } catch {
        showToast(`Path: ${previewCurrentFile.path}`, 'info');
      }
    });
  }

  if (btnModalMove) {
    btnModalMove.addEventListener('click', () => {
      if (!previewCurrentFile) return;
      previewModal.classList.remove('active');
      openMoveCategoryModal(previewCurrentFile.path, previewCurrentFile.name, previewCurrentFile.category);
    });
  }

  if (btnModalRename) {
    btnModalRename.addEventListener('click', () => {
      if (!previewCurrentFile) return;
      previewModal.classList.remove('active');
      openRenameModal(previewCurrentFile.path, previewCurrentFile.name);
    });
  }

  // Handle Sort
  async function handleSort(dryRun = false) {
    btnSort.disabled = true;
    btnPreview.disabled = true;

    appendLog(dryRun ? 'Running PREVIEW (Dry run without moving files)...' : 'Starting autonomous sorting...', 'cyan');

    try {
      const selectedModel = modelSelect.value;
      const res = await fetch(`/api/sort?dry_run=${dryRun}&model=${encodeURIComponent(selectedModel)}`, { method: 'POST' });
      const data = await res.json();

      if (data.status === 'success') {
        data.results.forEach(item => {
          appendLog(`[${item.category}] ${item.original_name} ➔ ${item.suggested_filename}`, 'success');
          appendLog(`   Reasoning: "${item.reasoning}"`, 'dim');
        });

        if (dryRun) {
          showToast(`Previewed ${data.processed_count} files (No files moved)`, 'info');
        } else {
          showToast(`Sorted ${data.processed_count} files into vaults!`, 'success');
        }
      } else {
        appendLog(data.message || 'No action performed.', 'amber');
      }
    } catch (err) {
      appendLog(`Sort failed: ${err.message}`, 'amber');
      showToast(`Error: ${err.message}`, 'warn');
    } finally {
      refreshState();
    }
  }

  // Handle Undo
  async function handleUndo() {
    btnUndo.disabled = true;
    appendLog('Reversing last sorting batch from manifest log...', 'amber');

    try {
      const res = await fetch('/api/undo', { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        appendLog('Manifest reversed: all files restored to original locations.', 'success');
        showToast('All files restored to inbox!', 'success');
      } else {
        appendLog(`Undo failed: ${data.message}`, 'amber');
      }
    } catch (err) {
      appendLog(`Undo error: ${err.message}`, 'amber');
    } finally {
      refreshState();
    }
  }

  // Handle Seed
  async function handleSeed() {
    appendLog('Seeding realistic clutter files into inbox...', 'cyan');
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      appendLog('Sample clutter files created.', 'success');
      showToast('Seeded 4 sample clutter files!', 'success');
      refreshState();
    } catch (err) {
      appendLog(`Seed failed: ${err.message}`, 'amber');
    }
  }

  // Handle Upload
  async function uploadFiles(files) {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    appendLog(`Uploading ${files.length} file(s) into inbox...`, 'cyan');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      appendLog(`Successfully uploaded ${data.count} file(s).`, 'success');
      showToast(`Uploaded ${data.count} file(s) to inbox!`, 'success');
      refreshState();
    } catch (err) {
      appendLog(`Upload failed: ${err.message}`, 'amber');
      showToast('Upload failed', 'warn');
    }
  }

  // Preset Selector change
  presetSelect.addEventListener('change', async (e) => {
    const preset = e.target.value;
    if (preset === 'add_custom') {
      // Revert select display back to current preset while dialog is open
      presetSelect.value = (currentState && currentState.current_preset) || 'demo';
      openCustomFolderModal();
      return;
    }

    appendLog(`Switching folder preset to: ${preset}...`, 'cyan');
    try {
      const res = await fetch(`/api/settings/preset?preset=${preset}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        showToast(`Target switched to ${data.inbox_path_display || preset}`, 'info');
        refreshState();
      }
    } catch (err) {
      appendLog(`Preset switch failed: ${err.message}`, 'amber');
    }
  });

  // Custom Folder Modal Elements
  const customFolderModal = document.getElementById('customFolderModal');
  const customFolderCloseBtn = document.getElementById('customFolderCloseBtn');
  const btnCancelCustomFolder = document.getElementById('btnCancelCustomFolder');
  const customFolderForm = document.getElementById('customFolderForm');
  const customInboxInput = document.getElementById('customInboxInput');
  const customVaultInput = document.getElementById('customVaultInput');

  const shortcutDesktop = document.getElementById('shortcutDesktop');
  const shortcutDocuments = document.getElementById('shortcutDocuments');
  const shortcutDownloads = document.getElementById('shortcutDownloads');

  function openCustomFolderModal() {
    customFolderModal.classList.add('active');
    customInboxInput.value = (currentState && currentState.current_preset === 'custom' && currentState.custom_inbox) 
      ? currentState.custom_inbox 
      : '';
    customVaultInput.value = (currentState && currentState.custom_vault) ? currentState.custom_vault : '';
    setTimeout(() => customInboxInput.focus(), 50);
  }

  function closeCustomFolderModal() {
    customFolderModal.classList.remove('active');
  }

  if (customFolderCloseBtn) customFolderCloseBtn.addEventListener('click', closeCustomFolderModal);
  if (btnCancelCustomFolder) btnCancelCustomFolder.addEventListener('click', closeCustomFolderModal);
  if (customFolderModal) {
    customFolderModal.addEventListener('click', (e) => {
      if (e.target === customFolderModal) closeCustomFolderModal();
    });
  }

  if (shortcutDesktop) {
    shortcutDesktop.addEventListener('click', () => {
      customInboxInput.value = (currentState && currentState.desktop_path) ? currentState.desktop_path : '~/Desktop';
    });
  }
  if (shortcutDocuments) {
    shortcutDocuments.addEventListener('click', () => {
      customInboxInput.value = (currentState && currentState.documents_path) ? currentState.documents_path : '~/Documents';
    });
  }
  if (shortcutDownloads) {
    shortcutDownloads.addEventListener('click', () => {
      customInboxInput.value = (currentState && currentState.user_downloads_path) ? currentState.user_downloads_path : '~/Downloads';
    });
  }

  if (customFolderForm) {
    customFolderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const inboxPath = customInboxInput.value.trim();
      const vaultPath = customVaultInput.value.trim();
      if (!inboxPath) return;

      appendLog(`Setting custom target folder: ${inboxPath}...`, 'cyan');
      const formData = new FormData();
      formData.append('inbox_path', inboxPath);
      if (vaultPath) formData.append('vault_path', vaultPath);

      try {
        const res = await fetch('/api/settings/custom-folder', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          closeCustomFolderModal();
          showToast(`Target set to ${data.inbox_path_display}!`, 'success');
          appendLog(`Custom folder active: ${data.inbox_path_display}`, 'success');
          refreshState();
        } else {
          throw new Error(data.detail || 'Failed to set custom folder');
        }
      } catch (err) {
        appendLog(`Custom folder error: ${err.message}`, 'amber');
        showToast(`Error: ${err.message}`, 'warn');
      }
    });
  }

  // Populate Category Select Dropdowns
  function populateCategoryDropdowns(allCategories) {
    if (!allCategories || allCategories.length === 0) return;
    const optionsHtml = allCategories.map(cat => {
      const icon = categoryIcons[cat] || '📁';
      return `<option value="${escapeHtml(cat)}">${icon} ${escapeHtml(cat)}</option>`;
    }).join('');

    if (moveTargetCategorySelect && moveTargetCategorySelect.children.length !== allCategories.length) {
      const currentVal = moveTargetCategorySelect.value;
      moveTargetCategorySelect.innerHTML = optionsHtml;
      if (currentVal) moveTargetCategorySelect.value = currentVal;
    }
    if (batchMoveTargetCategorySelect && batchMoveTargetCategorySelect.children.length !== allCategories.length) {
      batchMoveTargetCategorySelect.innerHTML = optionsHtml;
    }
  }

  // Delete File from Vault
  async function handleDeleteFile(path, name) {
    appendLog(`Deleting '${name}' from vault...`, 'amber');
    const formData = new FormData();
    formData.append('path', path);
    try {
      const res = await fetch('/api/vault/delete', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        selectedVaultPaths.delete(path);
        showToast(`Deleted '${name}'`, 'info');
        appendLog(`Deleted ${name}`, 'dim');
        refreshState();
      } else {
        throw new Error('Could not delete file');
      }
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'warn');
      appendLog(`Delete error: ${err.message}`, 'amber');
    }
  }

  // Move Category Modal Elements
  const moveCategoryModal = document.getElementById('moveCategoryModal');
  const moveCategoryCloseBtn = document.getElementById('moveCategoryCloseBtn');
  const btnCancelMoveCategory = document.getElementById('btnCancelMoveCategory');
  const moveCategoryForm = document.getElementById('moveCategoryForm');
  const moveFilePath = document.getElementById('moveFilePath');
  const moveFileName = document.getElementById('moveFileName');
  const moveTargetCategorySelect = document.getElementById('moveTargetCategorySelect');

  function openMoveCategoryModal(path, name, currentCategory) {
    if (!moveCategoryModal) return;
    moveFilePath.value = path;
    moveFileName.textContent = name;
    if (moveTargetCategorySelect && currentCategory) {
      moveTargetCategorySelect.value = currentCategory;
    }
    moveCategoryModal.classList.add('active');
  }

  function closeMoveCategoryModal() {
    if (moveCategoryModal) moveCategoryModal.classList.remove('active');
  }

  if (moveCategoryCloseBtn) moveCategoryCloseBtn.addEventListener('click', closeMoveCategoryModal);
  if (btnCancelMoveCategory) btnCancelMoveCategory.addEventListener('click', closeMoveCategoryModal);
  if (moveCategoryModal) {
    moveCategoryModal.addEventListener('click', (e) => {
      if (e.target === moveCategoryModal) closeMoveCategoryModal();
    });
  }

  if (moveCategoryForm) {
    moveCategoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const path = moveFilePath.value;
      const newCategory = moveTargetCategorySelect.value;
      if (!path || !newCategory) return;

      appendLog(`Moving '${moveFileName.textContent}' to '${newCategory}'...`, 'cyan');
      const formData = new FormData();
      formData.append('path', path);
      formData.append('new_category', newCategory);

      try {
        const res = await fetch('/api/vault/move', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          closeMoveCategoryModal();
          showToast(`Moved to ${newCategory}!`, 'success');
          appendLog(`File moved to ${newCategory}`, 'success');
          refreshState();
        } else {
          throw new Error(data.detail || 'Failed to move file');
        }
      } catch (err) {
        appendLog(`Move failed: ${err.message}`, 'amber');
        showToast(`Error: ${err.message}`, 'warn');
      }
    });
  }

  // Rename File Modal Elements
  const renameFileModal = document.getElementById('renameFileModal');
  const renameFileCloseBtn = document.getElementById('renameFileCloseBtn');
  const btnCancelRename = document.getElementById('btnCancelRename');
  const renameFileForm = document.getElementById('renameFileForm');
  const renameFilePath = document.getElementById('renameFilePath');
  const renameFileInput = document.getElementById('renameFileInput');

  function openRenameModal(path, currentName) {
    if (!renameFileModal) return;
    renameFilePath.value = path;
    renameFileInput.value = currentName;
    renameFileModal.classList.add('active');
    setTimeout(() => renameFileInput.focus(), 50);
  }

  function closeRenameModal() {
    if (renameFileModal) renameFileModal.classList.remove('active');
  }

  if (renameFileCloseBtn) renameFileCloseBtn.addEventListener('click', closeRenameModal);
  if (btnCancelRename) btnCancelRename.addEventListener('click', closeRenameModal);
  if (renameFileModal) {
    renameFileModal.addEventListener('click', (e) => {
      if (e.target === renameFileModal) closeRenameModal();
    });
  }

  if (renameFileForm) {
    renameFileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const path = renameFilePath.value;
      const newName = renameFileInput.value.trim();
      if (!path || !newName) return;

      appendLog(`Renaming file to '${newName}'...`, 'cyan');
      const formData = new FormData();
      formData.append('path', path);
      formData.append('new_name', newName);

      try {
        const res = await fetch('/api/vault/rename', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          closeRenameModal();
          showToast(`Renamed to '${newName}'!`, 'success');
          appendLog(`File renamed: ${data.old_name} ➔ ${data.new_name}`, 'success');
          refreshState();
        } else {
          throw new Error(data.detail || 'Rename failed');
        }
      } catch (err) {
        showToast(`Rename error: ${err.message}`, 'warn');
        appendLog(`Rename failed: ${err.message}`, 'amber');
      }
    });
  }

  // Add Custom Category Modal Elements
  const addCategoryModal = document.getElementById('addCategoryModal');
  const addCategoryCloseBtn = document.getElementById('addCategoryCloseBtn');
  const btnCancelAddCategory = document.getElementById('btnCancelAddCategory');
  const addCategoryForm = document.getElementById('addCategoryForm');
  const addCategoryInput = document.getElementById('addCategoryInput');

  function openAddCategoryModal() {
    if (!addCategoryModal) return;
    addCategoryInput.value = '';
    addCategoryModal.classList.add('active');
    setTimeout(() => addCategoryInput.focus(), 50);
  }

  function closeAddCategoryModal() {
    if (addCategoryModal) addCategoryModal.classList.remove('active');
  }

  if (btnOpenAddCategory) btnOpenAddCategory.addEventListener('click', openAddCategoryModal);
  if (addCategoryCloseBtn) addCategoryCloseBtn.addEventListener('click', closeAddCategoryModal);
  if (btnCancelAddCategory) btnCancelAddCategory.addEventListener('click', closeAddCategoryModal);
  if (addCategoryModal) {
    addCategoryModal.addEventListener('click', (e) => {
      if (e.target === addCategoryModal) closeAddCategoryModal();
    });
  }

  if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const catName = addCategoryInput.value.trim();
      if (!catName) return;

      appendLog(`Creating custom category folder '${catName}'...`, 'cyan');
      const formData = new FormData();
      formData.append('category_name', catName);

      try {
        const res = await fetch('/api/vault/create-category', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          closeAddCategoryModal();
          showToast(`Category '${catName}' created!`, 'success');
          appendLog(`Created category folder: ${catName}`, 'success');

          // Dynamically add new pill before "+ New Category" button if not existing
          let existingPill = document.querySelector(`.cat-pill[data-cat="${catName}"]`);
          if (!existingPill) {
            const newPill = document.createElement('button');
            newPill.className = 'cat-pill';
            newPill.setAttribute('data-cat', catName);
            newPill.textContent = `📁 ${catName} (0)`;
            newPill.addEventListener('click', (e) => {
              document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
              newPill.classList.add('active');
              activeCategoryFilter = catName;
              if (currentState) renderVaultFiles(currentState.vault_categories);
            });
            categoryFilterBar.insertBefore(newPill, btnOpenAddCategory);
          }
          refreshState();
        } else {
          throw new Error(data.detail || 'Could not create category');
        }
      } catch (err) {
        showToast(`Error: ${err.message}`, 'warn');
        appendLog(`Category creation error: ${err.message}`, 'amber');
      }
    });
  }

  // Batch Move Modal Elements
  const batchMoveModal = document.getElementById('batchMoveModal');
  const batchMoveCloseBtn = document.getElementById('batchMoveCloseBtn');
  const btnCancelBatchMove = document.getElementById('btnCancelBatchMove');
  const batchMoveForm = document.getElementById('batchMoveForm');
  const batchMoveTargetCategorySelect = document.getElementById('batchMoveTargetCategorySelect');
  const batchMoveCountText = document.getElementById('batchMoveCountText');

  function openBatchMoveModal() {
    if (!batchMoveModal || selectedVaultPaths.size === 0) return;
    if (batchMoveCountText) batchMoveCountText.textContent = `${selectedVaultPaths.size} files`;
    batchMoveModal.classList.add('active');
  }

  function closeBatchMoveModal() {
    if (batchMoveModal) batchMoveModal.classList.remove('active');
  }

  if (btnBatchMove) btnBatchMove.addEventListener('click', openBatchMoveModal);
  if (batchMoveCloseBtn) batchMoveCloseBtn.addEventListener('click', closeBatchMoveModal);
  if (btnCancelBatchMove) btnCancelBatchMove.addEventListener('click', closeBatchMoveModal);
  if (batchMoveModal) {
    batchMoveModal.addEventListener('click', (e) => {
      if (e.target === batchMoveModal) closeBatchMoveModal();
    });
  }

  if (batchMoveForm) {
    batchMoveForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const targetCat = batchMoveTargetCategorySelect.value;
      if (!targetCat || selectedVaultPaths.size === 0) return;

      appendLog(`Batch moving ${selectedVaultPaths.size} files to '${targetCat}'...`, 'cyan');
      const formData = new FormData();
      selectedVaultPaths.forEach(p => formData.append('paths', p));
      formData.append('new_category', targetCat);

      try {
        const res = await fetch('/api/vault/batch-move', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          closeBatchMoveModal();
          showToast(`Moved ${data.moved_count} files to ${targetCat}!`, 'success');
          appendLog(`Batch move completed: ${data.moved_count} files relocated.`, 'success');
          selectedVaultPaths.clear();
          refreshState();
        } else {
          throw new Error('Batch move failed');
        }
      } catch (err) {
        showToast(`Batch move error: ${err.message}`, 'warn');
        appendLog(`Batch move error: ${err.message}`, 'amber');
      }
    });
  }

  // Batch ZIP Archive Download
  if (btnBatchZip) {
    btnBatchZip.addEventListener('click', async () => {
      if (selectedVaultPaths.size === 0) return;
      appendLog(`Packaging ${selectedVaultPaths.size} files into ZIP archive...`, 'cyan');
      const formData = new FormData();
      selectedVaultPaths.forEach(p => formData.append('paths', p));

      try {
        const res = await fetch('/api/vault/batch-zip', {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw new Error('ZIP creation failed');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `slothsort_selected_${selectedVaultPaths.size}_files.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showToast('Downloaded ZIP archive!', 'success');
        appendLog(`ZIP archive downloaded successfully.`, 'success');
      } catch (err) {
        showToast(`ZIP error: ${err.message}`, 'warn');
        appendLog(`ZIP failed: ${err.message}`, 'amber');
      }
    });
  }

  // Batch Delete
  if (btnBatchDelete) {
    btnBatchDelete.addEventListener('click', async () => {
      if (selectedVaultPaths.size === 0) return;
      if (!confirm(`Are you sure you want to delete ${selectedVaultPaths.size} selected files from the vault?`)) {
        return;
      }

      appendLog(`Batch deleting ${selectedVaultPaths.size} files...`, 'amber');
      const formData = new FormData();
      selectedVaultPaths.forEach(p => formData.append('paths', p));

      try {
        const res = await fetch('/api/vault/batch-delete', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          showToast(`Deleted ${data.deleted_count} files!`, 'info');
          appendLog(`Batch deleted ${data.deleted_count} files.`, 'dim');
          selectedVaultPaths.clear();
          refreshState();
        } else {
          throw new Error('Batch delete failed');
        }
      } catch (err) {
        showToast(`Delete error: ${err.message}`, 'warn');
      }
    });
  }

  // Batch Clear & Select All
  if (btnBatchClear) {
    btnBatchClear.addEventListener('click', () => {
      selectedVaultPaths.clear();
      renderVaultFiles(currentState ? currentState.vault_categories : {});
    });
  }

  if (btnSelectAll) {
    btnSelectAll.addEventListener('click', () => {
      if (selectedVaultPaths.size > 0) {
        selectedVaultPaths.clear();
      } else {
        document.querySelectorAll('.vault-item-checkbox').forEach(cb => {
          const p = cb.getAttribute('data-path');
          if (p) selectedVaultPaths.add(p);
        });
      }
      renderVaultFiles(currentState ? currentState.vault_categories : {});
    });
  }

  // Sorting Mode change
  if (vaultSortSelect) {
    vaultSortSelect.addEventListener('change', (e) => {
      activeSortMode = e.target.value;
      if (currentState) renderVaultFiles(currentState.vault_categories);
    });
  }

  // View Mode switcher
  if (btnViewGroup) {
    btnViewGroup.addEventListener('click', () => {
      btnViewGroup.classList.add('active');
      btnViewList.classList.remove('active');
      btnViewGrid.classList.remove('active');
      activeViewMode = 'group';
      if (currentState) renderVaultFiles(currentState.vault_categories);
    });
  }

  if (btnViewList) {
    btnViewList.addEventListener('click', () => {
      btnViewList.classList.add('active');
      btnViewGroup.classList.remove('active');
      btnViewGrid.classList.remove('active');
      activeViewMode = 'list';
      if (currentState) renderVaultFiles(currentState.vault_categories);
    });
  }

  if (btnViewGrid) {
    btnViewGrid.addEventListener('click', () => {
      btnViewGrid.classList.add('active');
      btnViewGroup.classList.remove('active');
      btnViewList.classList.remove('active');
      activeViewMode = 'grid';
      if (currentState) renderVaultFiles(currentState.vault_categories);
    });
  }

  // Model Selector change
  modelSelect.addEventListener('change', async (e) => {
    const model = e.target.value;
    appendLog(`Active local model set to: ${model}`, 'cyan');
    try {
      await fetch(`/api/settings/model?model=${encodeURIComponent(model)}`, { method: 'POST' });
      refreshState();
    } catch (err) {
      appendLog(`Model update failed: ${err.message}`, 'amber');
    }
  });

  // Guide Banner toggle
  btnToggleGuide.addEventListener('click', () => {
    guideBanner.style.display = guideBanner.style.display === 'none' ? 'flex' : 'none';
  });
  btnCloseGuide.addEventListener('click', () => {
    guideBanner.style.display = 'none';
  });

  // Search input filter
  searchInput.addEventListener('input', (e) => {
    activeSearchTerm = e.target.value.trim();
    if (currentState) renderVaultFiles(currentState.vault_categories);
  });

  // Category filter buttons
  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      if (e.target.id === 'btnOpenAddCategory') return;
      document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      activeCategoryFilter = e.target.getAttribute('data-cat') || 'all';
      if (currentState) renderVaultFiles(currentState.vault_categories);
    });
  });

  // Action Buttons
  btnSort.addEventListener('click', () => handleSort(false));
  btnPreview.addEventListener('click', () => handleSort(true));
  btnUndo.addEventListener('click', handleUndo);
  btnSeed.addEventListener('click', handleSeed);

  btnClearLogs.addEventListener('click', (e) => {
    e.stopPropagation();
    consoleLogs.innerHTML = '<div class="log-line log-dim">[System] Log cleared.</div>';
    if (consoleLatestTicker) consoleLatestTicker.textContent = '[System] Log cleared.';
  });

  // Collapsible Console Drawer Toggle
  if (consoleToggleHeader && consoleDrawer) {
    const toggleConsole = (e) => {
      if (e.target && e.target.id === 'btnClearLogs') return;
      consoleDrawer.classList.toggle('expanded');
      if (btnToggleConsole) {
        btnToggleConsole.textContent = consoleDrawer.classList.contains('expanded') ? '▼' : '▲';
      }
    };
    consoleToggleHeader.addEventListener('click', toggleConsole);
  }

  // Drag and Drop
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => uploadFiles(e.target.files));

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-active');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-active');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    uploadFiles(e.dataTransfer.files);
  });

  // Initial load & poll every 5 seconds
  refreshState();
  setInterval(refreshState, 5000);
});
