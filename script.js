// Global variables
const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

// Function to get prayer name based on day of week
function getPrayerName(prayer) {
    if (prayer === 'dhuhr') {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
        if (dayOfWeek === 5) { // Friday
            return 'জুম্মা';
        }
    }
    
    const prayerNames = {
        'fajr': 'ফজর',
        'dhuhr': 'জোহর', 
        'asr': 'আসর',
        'maghrib': 'মাগরিব',
        'isha': 'এশা'
    };
    
    return prayerNames[prayer];
}

const prayerNames = {
    'fajr': 'ফজর',
    'dhuhr': 'জোহর', 
    'asr': 'আসর',
    'maghrib': 'মাগরিব',
    'isha': 'এশা'
};

let currentUser = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Wait for auth state to be determined
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            initializeApp();
            startMidnightChecker(); // Start midnight reset checker
        }
    });
});

function initializeApp() {
    updateCurrentDate();
    updatePrayerNames(); // Update prayer names based on current day
    loadTodayData();
    updateMonthlyStats();
    setupEventListeners();
}

// Start midnight checker for slider reset
function startMidnightChecker() {
    // Check every minute for midnight
    setInterval(() => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        
        // Check if it's midnight (00:00)
        if (hours === 0 && minutes === 0) {
            resetDailySliders();
        }
    }, 60000); // Check every minute
    
    // Also check on page load if it's a new day
    checkForNewDay();
}

// Check if it's a new day and reset sliders if needed
function checkForNewDay() {
    if (!currentUser) return;
    
    const lastResetKey = getUserStorageKey('last-reset-date');
    const lastResetDate = localStorage.getItem(lastResetKey);
    const today = getTodayKey();
    
    if (lastResetDate !== today) {
        resetDailySliders();
        localStorage.setItem(lastResetKey, today);
    }
}

// Reset daily sliders while keeping statistics intact
function resetDailySliders() {
    if (!currentUser) return;
    
    // Reset all prayer sliders to unchecked
    prayers.forEach(prayer => {
        const prayedEl = document.getElementById(`${prayer}-prayed`);
        const jamaatEl = document.getElementById(`${prayer}-jamaat`);
        
        if (prayedEl && jamaatEl) {
            prayedEl.checked = false;
            jamaatEl.checked = false;
        }
    });
    
    // Update the date display
    updateCurrentDate();
    
    // Update prayer names for the new day
    updatePrayerNames();
    
    // Show a message to user (optional)
    console.log('Daily sliders reset for new day');
}

// Update prayer names based on current day
function updatePrayerNames() {
    const dhuhrNameElement = document.getElementById('dhuhr-name');
    if (dhuhrNameElement) {
        dhuhrNameElement.textContent = getPrayerName('dhuhr');
    }
}

// Update current date display
function updateCurrentDate() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    const dateStr = now.toLocaleDateString('bn-BD', options);
    document.getElementById('currentDate').textContent = dateStr;
}

// Setup event listeners
function setupEventListeners() {
    // Auto-save when checkboxes change
    prayers.forEach(prayer => {
        const prayedCheckbox = document.getElementById(`${prayer}-prayed`);
        const jamaatCheckbox = document.getElementById(`${prayer}-jamaat`);
        
        if (prayedCheckbox && jamaatCheckbox) {
            prayedCheckbox.addEventListener('change', function() {
                if (!this.checked) {
                    jamaatCheckbox.checked = false;
                }
                autoSaveData();
            });
            
            jamaatCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    prayedCheckbox.checked = true;
                }
                autoSaveData();
            });
        }
    });

    // Button event listeners
    const saveBtn = document.getElementById('saveData');
    const calendarBtn = document.getElementById('calendarView');
    
    if (saveBtn) saveBtn.addEventListener('click', saveData);
    if (calendarBtn) calendarBtn.addEventListener('click', showCalendarView);
    
    // Calendar view buttons
    const weeklyBtn = document.getElementById('viewWeekly');
    const monthlyBtn = document.getElementById('viewMonthly');
    
    if (weeklyBtn) {
        weeklyBtn.addEventListener('click', function() {
            document.getElementById('viewWeekly').classList.add('active');
            document.getElementById('viewMonthly').classList.remove('active');
            document.getElementById('weeklyView').style.display = 'block';
            document.getElementById('monthlyView').style.display = 'none';
            renderWeeklyView();
        });
    }
    
    if (monthlyBtn) {
        monthlyBtn.addEventListener('click', function() {
            document.getElementById('viewMonthly').classList.add('active');
            document.getElementById('viewWeekly').classList.remove('active');
            document.getElementById('weeklyView').style.display = 'none';
            document.getElementById('monthlyView').style.display = 'block';
            renderMonthlyView();
        });
    }
    
    // Navigation buttons
    const prevWeekBtn = document.getElementById('prevWeek');
    const nextWeekBtn = document.getElementById('nextWeek');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    
    if (prevWeekBtn) prevWeekBtn.addEventListener('click', () => changeWeek(-1));
    if (nextWeekBtn) nextWeekBtn.addEventListener('click', () => changeWeek(1));
    if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => changeMonth(1));
}

// Get user-specific storage key
function getUserStorageKey(key) {
    if (!currentUser) return key;
    return `${currentUser.uid}-${key}`;
}

// Get today's date key
function getTodayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

// Get current month key
function getCurrentMonthKey() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}

// Auto-save data with user-specific storage and edit history
function autoSaveData() {
    if (!currentUser) return;
    
    const todayKey = getTodayKey();
    const storageKey = getUserStorageKey(`prayer-${todayKey}`);
    const data = {};
    
    prayers.forEach(prayer => {
        const prayedEl = document.getElementById(`${prayer}-prayed`);
        const jamaatEl = document.getElementById(`${prayer}-jamaat`);
        
        if (prayedEl && jamaatEl) {
            data[prayer] = {
                prayed: prayedEl.checked,
                jamaat: jamaatEl.checked
            };
        }
    });
    
    // Save the prayer data
    localStorage.setItem(storageKey, JSON.stringify(data));
    
    // Log the edit history
    logEditHistory(todayKey, data);
    
    updateMonthlyStats();
}

// Log edit history for data changes
function logEditHistory(dateKey, newData) {
    if (!currentUser) return;
    
    const historyKey = getUserStorageKey('edit-history');
    let history = [];
    
    // Get existing history
    const existingHistory = localStorage.getItem(historyKey);
    if (existingHistory) {
        history = JSON.parse(existingHistory);
    }
    
    // Get previous data for comparison
    const storageKey = getUserStorageKey(`prayer-${dateKey}`);
    const previousDataStr = localStorage.getItem(storageKey);
    let previousData = {};
    
    if (previousDataStr) {
        previousData = JSON.parse(previousDataStr);
    }
    
    // Check if there are any changes
    let hasChanges = false;
    const changes = {};
    
    prayers.forEach(prayer => {
        const oldPrayed = previousData[prayer]?.prayed || false;
        const oldJamaat = previousData[prayer]?.jamaat || false;
        const newPrayed = newData[prayer]?.prayed || false;
        const newJamaat = newData[prayer]?.jamaat || false;
        
        if (oldPrayed !== newPrayed || oldJamaat !== newJamaat) {
            hasChanges = true;
            changes[prayer] = {
                old: { prayed: oldPrayed, jamaat: oldJamaat },
                new: { prayed: newPrayed, jamaat: newJamaat }
            };
        }
    });
    
    // Only log if there are actual changes
    if (hasChanges) {
        const now = new Date();
        const editEntry = {
            id: Date.now(), // Unique ID for the edit
            dateEdited: dateKey, // The date that was edited
            editTime: now.toISOString(), // When the edit was made
            editTimeFormatted: now.toLocaleDateString('bn-BD', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            changes: changes,
            userId: currentUser.uid
        };
        
        // Add to history (keep only last 100 entries)
        history.unshift(editEntry);
        if (history.length > 100) {
            history = history.slice(0, 100);
        }
        
        // Save updated history
        localStorage.setItem(historyKey, JSON.stringify(history));
    }
}

// Save data with confirmation
function saveData() {
    autoSaveData();
    showSuccessMessage('আজকের ডেটা সফলভাবে সেভ হয়েছে!');
}

// Load today's data with user-specific storage
function loadTodayData() {
    if (!currentUser) return;
    
    const todayKey = getTodayKey();
    const storageKey = getUserStorageKey(`prayer-${todayKey}`);
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
        const data = JSON.parse(savedData);
        prayers.forEach(prayer => {
            if (data[prayer]) {
                const prayedEl = document.getElementById(`${prayer}-prayed`);
                const jamaatEl = document.getElementById(`${prayer}-jamaat`);
                
                if (prayedEl && jamaatEl) {
                    prayedEl.checked = data[prayer].prayed;
                    jamaatEl.checked = data[prayer].jamaat;
                }
            }
        });
    }
}

// Update monthly statistics with user-specific data
function updateMonthlyStats() {
    if (!currentUser) return;
    
    const currentMonth = getCurrentMonthKey();
    const stats = {};
    
    prayers.forEach(prayer => {
        stats[prayer] = { total: 0, jamaat: 0 };
    });
    
    // Get all data for current month for current user
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const userPrefix = `${currentUser.uid}-prayer-`;
        
        if (key.startsWith(userPrefix) && key.includes(currentMonth)) {
            const data = JSON.parse(localStorage.getItem(key));
            prayers.forEach(prayer => {
                if (data[prayer]) {
                    if (data[prayer].prayed) stats[prayer].total++;
                    if (data[prayer].jamaat) stats[prayer].jamaat++;
                }
            });
        }
    }
    
    // Update display
    prayers.forEach(prayer => {
        const totalEl = document.getElementById(`${prayer}-total`);
        const jamaatEl = document.getElementById(`${prayer}-jamaat-count`);
        
        if (totalEl && jamaatEl) {
            totalEl.textContent = stats[prayer].total;
            jamaatEl.textContent = stats[prayer].jamaat;
        }
    });
}

// Show calendar view
function showCalendarView() {
    if (!currentUser) return;
    
    // Hide stats section and action buttons only
    const statsSection = document.querySelector('.stats-section');
    const actionButtons = document.querySelector('.action-buttons');
    
    if (statsSection) statsSection.style.display = 'none';
    if (actionButtons) actionButtons.style.display = 'none';
    
    // Create or show calendar section
    let calendarSection = document.querySelector('.calendar-section');
    if (!calendarSection) {
        calendarSection = createCalendarSection();
        document.querySelector('.container').appendChild(calendarSection);
    } else {
        calendarSection.style.display = 'block';
    }
    
    renderCalendarView();
}

// Create calendar section
function createCalendarSection() {
    const section = document.createElement('div');
    section.className = 'calendar-section';
    section.innerHTML = `
        <div class="section-header">
            <h2>নামাজের ইতিহাস</h2>
            <button class="btn btn-secondary" onclick="showMainView()">হোমে ফিরে যান</button>
            <div class="calendar-controls">
                <button class="view-btn active" data-view="weekly">সাপ্তাহিক</button>
                <button class="view-btn" data-view="monthly">মাসিক</button>
            </div>
        </div>
        <div class="calendar-actions">
            <button class="btn btn-primary" onclick="saveData()">আজকের ডাটা সেভ করুন</button>
            <button class="btn btn-secondary" onclick="showMainView()">হোমে ফিরে যান</button>
        </div>
        <div class="calendar-view">
            <div class="week-navigation" style="display: block;">
                <button class="nav-btn" onclick="changeWeek(-1)">‹</button>
                <h3 id="currentWeek"></h3>
                <button class="nav-btn" onclick="changeWeek(1)">›</button>
            </div>
            <div class="month-navigation" style="display: none;">
                <button class="nav-btn" onclick="changeMonth(-1)">‹</button>
                <h3 id="currentMonth"></h3>
                <button class="nav-btn" onclick="changeMonth(1)">›</button>
            </div>
            <div class="weekly-calendar" id="weeklyCalendar"></div>
            <div class="monthly-calendar" id="monthlyCalendar" style="display: none;"></div>
        </div>
        <div class="calendar-legend">
            <div class="legend-item">
                <div class="legend-color complete"></div>
                <span>সব নামাজ পড়া হয়েছে</span>
            </div>
            <div class="legend-item">
                <div class="legend-color jamaat"></div>
                <span>জামাতে পড়া হয়েছে</span>
            </div>
            <div class="legend-item">
                <div class="legend-color partial"></div>
                <span>কিছু নামাজ পড়া হয়েছে</span>
            </div>
            <div class="legend-item">
                <div class="legend-color none"></div>
                <span>কোন নামাজ পড়া হয়নি</span>
            </div>
        </div>
    `;
    
    // Add event listeners for view buttons
    section.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            section.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const view = this.dataset.view;
            if (view === 'weekly') {
                section.querySelector('.week-navigation').style.display = 'block';
                section.querySelector('.month-navigation').style.display = 'none';
                section.querySelector('#weeklyCalendar').style.display = 'grid';
                section.querySelector('#monthlyCalendar').style.display = 'none';
                renderWeeklyView();
            } else {
                section.querySelector('.week-navigation').style.display = 'none';
                section.querySelector('.month-navigation').style.display = 'block';
                section.querySelector('#weeklyCalendar').style.display = 'none';
                section.querySelector('#monthlyCalendar').style.display = 'grid';
                renderMonthlyView();
            }
        });
    });
    
    return section;
}

// Show main view
function showMainView() {
    const statsSection = document.querySelector('.stats-section');
    const calendarSection = document.querySelector('.calendar-section');
    const chartSection = document.querySelector('.charts-section');
    const actionButtons = document.querySelector('.action-buttons');
    
    if (statsSection) statsSection.style.display = 'block';
    if (calendarSection) calendarSection.style.display = 'none';
    if (chartSection) chartSection.style.display = 'none';
    if (actionButtons) actionButtons.style.display = 'flex';
}

// Calendar navigation variables
let currentWeekStart = new Date();
let currentMonthDate = new Date();

// Set current week to start of week
currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

// Change week
function changeWeek(direction) {
    currentWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
    renderWeeklyView();
}

// Change month
function changeMonth(direction) {
    currentMonthDate.setMonth(currentMonthDate.getMonth() + direction);
    renderMonthlyView();
}

// Render calendar view
function renderCalendarView() {
    renderWeeklyView();
}

// Render weekly view
function renderWeeklyView() {
    if (!currentUser) return;
    
    const weekElement = document.getElementById('currentWeek');
    const calendarElement = document.getElementById('weeklyCalendar');
    
    if (!weekElement || !calendarElement) return;
    
    // Update week header
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const startStr = currentWeekStart.toLocaleDateString('bn-BD', options);
    const endStr = weekEnd.toLocaleDateString('bn-BD', options);
    weekElement.textContent = `${startStr} - ${endStr}`;
    
    // Clear calendar
    calendarElement.innerHTML = '';
    
    // Generate week days
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + i);
        
        const dayElement = createDayElement(date);
        calendarElement.appendChild(dayElement);
    }
}

// Render monthly view
function renderMonthlyView() {
    if (!currentUser) return;
    
    const monthElement = document.getElementById('currentMonth');
    const calendarElement = document.getElementById('monthlyCalendar');
    
    if (!monthElement || !calendarElement) return;
    
    // Update month header
    const options = { year: 'numeric', month: 'long' };
    monthElement.textContent = currentMonthDate.toLocaleDateString('bn-BD', options);
    
    // Clear calendar
    calendarElement.innerHTML = '';
    
    // Get first day of month and number of days
    const firstDay = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1);
    const lastDay = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0);
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyElement = document.createElement('div');
        emptyElement.className = 'calendar-day empty';
        calendarElement.appendChild(emptyElement);
    }
    
    // Add days of month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), day);
        const dayElement = createDayElement(date);
        calendarElement.appendChild(dayElement);
    }
}

// Create day element
function createDayElement(date) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const storageKey = getUserStorageKey(`prayer-${dateKey}`);
    const dayData = localStorage.getItem(storageKey);
    
    let prayedCount = 0;
    let jamaatCount = 0;
    
    if (dayData) {
        const data = JSON.parse(dayData);
        prayers.forEach(prayer => {
            if (data[prayer]) {
                if (data[prayer].prayed) prayedCount++;
                if (data[prayer].jamaat) jamaatCount++;
            }
        });
    }
    
    // Determine day status
    let dayClass = 'none';
    if (prayedCount === 5) {
        dayClass = jamaatCount >= 3 ? 'jamaat' : 'complete';
    } else if (prayedCount > 0) {
        dayClass = 'partial';
    }
    
    dayElement.classList.add(dayClass);
    
    dayElement.innerHTML = `
        <div class="day-number">${toBengaliNumber(date.getDate())}</div>
        <div class="day-prayers">${toBengaliNumber(prayedCount)}/৫ নামাজ</div>
    `;
    
    // Add click event listener for editing past data
    dayElement.addEventListener('click', () => {
        openEditModal(date, dateKey);
    });
    
    // Add cursor pointer style
    dayElement.style.cursor = 'pointer';
    
    return dayElement;
}

// Open edit modal for past prayer data
function openEditModal(date, dateKey) {
    if (!currentUser) return;
    
    // Remove existing modal if any
    const existingModal = document.querySelector('.edit-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const storageKey = getUserStorageKey(`prayer-${dateKey}`);
    const savedData = localStorage.getItem(storageKey);
    let data = {};
    
    if (savedData) {
        data = JSON.parse(savedData);
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${date.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })} এর নামাজ এডিট করুন</h3>
                    <button class="modal-close" onclick="closeEditModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="prayer-edit-list">
                        ${prayers.map(prayer => `
                            <div class="prayer-edit-row">
                                <div class="prayer-name">${prayerNames[prayer]}</div>
                                <div class="prayer-controls">
                                    <label class="toggle">
                                        <input type="checkbox" id="edit-${prayer}-prayed" ${data[prayer]?.prayed ? 'checked' : ''}>
                                        <span class="slider"></span>
                                        <span class="label">পড়া হয়েছে</span>
                                    </label>
                                    <label class="toggle">
                                        <input type="checkbox" id="edit-${prayer}-jamaat" ${data[prayer]?.jamaat ? 'checked' : ''}>
                                        <span class="slider"></span>
                                        <span class="label">জামাতে</span>
                                    </label>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="saveEditedData('${dateKey}')">সেভ করুন</button>
                    <button class="btn btn-secondary" onclick="closeEditModal()">বাতিল</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners for checkbox dependencies
    prayers.forEach(prayer => {
        const prayedCheckbox = document.getElementById(`edit-${prayer}-prayed`);
        const jamaatCheckbox = document.getElementById(`edit-${prayer}-jamaat`);
        
        if (prayedCheckbox && jamaatCheckbox) {
            prayedCheckbox.addEventListener('change', function() {
                if (!this.checked) {
                    jamaatCheckbox.checked = false;
                }
            });
            
            jamaatCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    prayedCheckbox.checked = true;
                }
            });
        }
    });
}

// Close edit modal
function closeEditModal() {
    const modal = document.querySelector('.edit-modal');
    if (modal) {
        modal.remove();
    }
}

// Save edited prayer data with history logging
function saveEditedData(dateKey) {
    if (!currentUser) return;
    
    const storageKey = getUserStorageKey(`prayer-${dateKey}`);
    
    // Get previous data for history logging
    const previousDataStr = localStorage.getItem(storageKey);
    let previousData = {};
    if (previousDataStr) {
        previousData = JSON.parse(previousDataStr);
    }
    
    const data = {};
    
    prayers.forEach(prayer => {
        const prayedEl = document.getElementById(`edit-${prayer}-prayed`);
        const jamaatEl = document.getElementById(`edit-${prayer}-jamaat`);
        
        if (prayedEl && jamaatEl) {
            data[prayer] = {
                prayed: prayedEl.checked,
                jamaat: jamaatEl.checked
            };
        }
    });
    
    // Save the updated data
    localStorage.setItem(storageKey, JSON.stringify(data));
    
    // Log the edit history for past date edits
    logEditHistoryForPastDate(dateKey, previousData, data);
    
    // Update monthly stats
    updateMonthlyStats();
    
    // Re-render calendar view
    renderCalendarView();
    
    // Close modal
    closeEditModal();
    
    // Show success message
    showSuccessMessage('ডেটা সফলভাবে আপডেট হয়েছে!');
}

// Log edit history specifically for past date edits
function logEditHistoryForPastDate(dateKey, previousData, newData) {
    if (!currentUser) return;
    
    const historyKey = getUserStorageKey('edit-history');
    let history = [];
    
    // Get existing history
    const existingHistory = localStorage.getItem(historyKey);
    if (existingHistory) {
        history = JSON.parse(existingHistory);
    }
    
    // Check if there are any changes
    let hasChanges = false;
    const changes = {};
    
    prayers.forEach(prayer => {
        const oldPrayed = previousData[prayer]?.prayed || false;
        const oldJamaat = previousData[prayer]?.jamaat || false;
        const newPrayed = newData[prayer]?.prayed || false;
        const newJamaat = newData[prayer]?.jamaat || false;
        
        if (oldPrayed !== newPrayed || oldJamaat !== newJamaat) {
            hasChanges = true;
            changes[prayer] = {
                old: { prayed: oldPrayed, jamaat: oldJamaat },
                new: { prayed: newPrayed, jamaat: newJamaat }
            };
        }
    });
    
    // Only log if there are actual changes
    if (hasChanges) {
        const now = new Date();
        const editedDate = new Date(dateKey);
        const editEntry = {
            id: Date.now(), // Unique ID for the edit
            dateEdited: dateKey, // The date that was edited
            editTime: now.toISOString(), // When the edit was made
            editTimeFormatted: now.toLocaleDateString('bn-BD', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            editedDateFormatted: editedDate.toLocaleDateString('bn-BD', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            changes: changes,
            userId: currentUser.uid,
            isPastEdit: true // Flag to indicate this was a past date edit
        };
        
        // Add to history (keep only last 100 entries)
        history.unshift(editEntry);
        if (history.length > 100) {
            history = history.slice(0, 100);
        }
        
        // Save updated history
        localStorage.setItem(historyKey, JSON.stringify(history));
    }
}

// Show success message
function showSuccessMessage(message) {
    // Remove existing message if any
    const existingMessage = document.querySelector('.success-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    
    const main = document.querySelector('main') || document.querySelector('.container');
    if (main) {
        main.insertBefore(messageDiv, main.firstChild);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Utility function to get Bengali numbers
function toBengaliNumber(num) {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, digit => bengaliDigits[digit]);
}

// Clear user data (for testing)
function clearUserData() {
    if (!currentUser) return;
    
    const userPrefix = `${currentUser.uid}-`;
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(userPrefix)) {
            keysToRemove.push(key);
        }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Reload data
    loadTodayData();
    updateMonthlyStats();
    showSuccessMessage('ব্যবহারকারীর ডেটা মুছে ফেলা হয়েছে!');
}

// Show edit history
function showEditHistory() {
    if (!currentUser) {
        showEditHistoryMessage('অনুগ্রহ করে প্রথমে লগইন করুন।');
        return;
    }
    
    const historyKey = getUserStorageKey('edit-history');
    const historyData = localStorage.getItem(historyKey);
    
    if (!historyData) {
        showEditHistoryMessage('কোনো এডিট হিস্ট্রি পাওয়া যায়নি।');
        return;
    }
    
    const history = JSON.parse(historyData);
    
    if (history.length === 0) {
        showEditHistoryMessage('কোনো এডিট হিস্ট্রি পাওয়া যায়নি।');
        return;
    }
    
    // Remove existing modal if any
    const existingModal = document.querySelector('.history-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create history modal
    const modal = document.createElement('div');
    modal.className = 'history-modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3>ডেটা এডিট হিস্ট্রি</h3>
                    <button class="modal-close" onclick="closeHistoryModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="history-list">
                        ${history.map(entry => `
                            <div class="history-entry">
                                <div class="history-header">
                                    <strong>${entry.isPastEdit ? 'পূর্বের তারিখ এডিট:' : 'আজকের ডেটা এডিট:'} ${entry.editedDateFormatted || entry.dateEdited}</strong>
                                    <span class="edit-time">এডিট করা হয়েছে: ${entry.editTimeFormatted}</span>
                                </div>
                                <div class="history-changes">
                                    ${Object.keys(entry.changes).map(prayer => {
                                        const change = entry.changes[prayer];
                                        const prayerName = prayerNames[prayer];
                                        return `
                                            <div class="change-item">
                                                <strong>${prayerName}:</strong>
                                                <div class="change-details">
                                                    <span class="old-value">পূর্বে: ${change.old.prayed ? '✓' : '✗'} পড়া, ${change.old.jamaat ? '✓' : '✗'} জামাত</span>
                                                    <span class="arrow">→</span>
                                                    <span class="new-value">নতুন: ${change.new.prayed ? '✓' : '✗'} পড়া, ${change.new.jamaat ? '✓' : '✗'} জামাত</span>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeHistoryModal()">বন্ধ করুন</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Show edit history message near the button
function showEditHistoryMessage(message) {
    // Remove existing message if any
    const existingMessage = document.querySelector('.edit-history-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const editHistoryBtn = document.getElementById('editHistory');
    if (!editHistoryBtn) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'edit-history-message';
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: absolute;
        background: #f8f9fa;
        color: #6c757d;
        padding: 10px 15px;
        border-radius: 5px;
        border: 1px solid #dee2e6;
        font-size: 14px;
        margin-top: 5px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        z-index: 100;
        max-width: 250px;
    `;
    
    // Position the message below the button
    const actionButtons = document.querySelector('.action-buttons');
    if (actionButtons) {
        actionButtons.style.position = 'relative';
        actionButtons.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Close history modal
function closeHistoryModal() {
    const modal = document.querySelector('.history-modal');
    if (modal) {
        modal.remove();
    }
}

// Export functions for global access
window.showEditHistory = showEditHistory;
window.closeHistoryModal = closeHistoryModal;




