// Calendar and Chart Handler
class CalendarHandler {
    constructor() {
        this.currentView = 'weekly';
        this.currentWeekStart = new Date();
        this.currentMonthDate = new Date();
        this.currentUser = null;
        
        // Set current week to start of week (Sunday)
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() - this.currentWeekStart.getDay());
        
        // Initialize when auth state changes
        firebase.auth().onAuthStateChanged((user) => {
            this.currentUser = user;
        });
    }

    // Get user-specific storage key
    getUserStorageKey(key) {
        if (!this.currentUser) return key;
        return `${this.currentUser.uid}-${key}`;
    }

    // Show calendar view
    showCalendarView() {
        if (!this.currentUser) {
            this.showMessage('অনুগ্রহ করে প্রথমে লগইন করুন।', 'error');
            return;
        }
        
        const statsSection = document.querySelector(".stats-section");
        const actionButtons = document.querySelector(".action-buttons");
        
        // Add fade out animation to main content
        if (statsSection) {
            statsSection.style.opacity = "1";
            statsSection.style.transform = "translateY(0)";
            statsSection.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
            
            setTimeout(() => {
                statsSection.style.opacity = "0";
                statsSection.style.transform = "translateY(-20px)";
            }, 50);
        }
        
        if (actionButtons) {
            actionButtons.style.opacity = "1";
            actionButtons.style.transform = "translateY(0)";
            actionButtons.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
            
            setTimeout(() => {
                actionButtons.style.opacity = "0";
                actionButtons.style.transform = "translateY(-20px)";
            }, 50);
        }
        
        setTimeout(() => {
            // Hide main content
            this.hideMainContent();
            
            // Create or show calendar section
            let calendarSection = document.querySelector('.calendar-section');
            if (!calendarSection) {
                calendarSection = this.createCalendarSection();
                document.querySelector('.container').appendChild(calendarSection);
            } else {
                calendarSection.style.display = 'block';
            }
            
            // Add fade in animation to calendar section
            calendarSection.style.opacity = "0";
            calendarSection.style.transform = "translateY(20px)";
            calendarSection.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
            
            setTimeout(() => {
                calendarSection.style.opacity = "1";
                calendarSection.style.transform = "translateY(0)";
            }, 50);
            
            this.renderCalendarView();
        }, 400);
    }

    // Hide main content
    hideMainContent() {
        const statsSection = document.querySelector(".stats-section");
        const actionButtons = document.querySelector(".action-buttons");
        
        if (statsSection) statsSection.style.display = "none";
        if (actionButtons) actionButtons.style.display = "none";
    }

    // Show main view with animation
    showMainView() {
        const statsSection = document.querySelector(".stats-section");
        const calendarSection = document.querySelector(".calendar-section");
        const actionButtons = document.querySelector(".action-buttons");
        
        // Add fade out animation to calendar section
        if (calendarSection) {
            calendarSection.style.opacity = "1";
            calendarSection.style.transform = "translateY(0)";
            calendarSection.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
            
            // Start fade out animation
            setTimeout(() => {
                calendarSection.style.opacity = "0";
                calendarSection.style.transform = "translateY(-20px)";
            }, 50);
            
            setTimeout(() => {
                calendarSection.style.display = "none";
                
                // Show main content with fade in animation
                if (statsSection) {
                    statsSection.style.display = "block";
                    statsSection.style.opacity = "0";
                    statsSection.style.transform = "translateY(20px)";
                    statsSection.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
                    
                    setTimeout(() => {
                        statsSection.style.opacity = "1";
                        statsSection.style.transform = "translateY(0)";
                    }, 50);
                }
                
                if (actionButtons) {
                    actionButtons.style.display = "flex";
                    actionButtons.style.opacity = "0";
                    actionButtons.style.transform = "translateY(20px)";
                    actionButtons.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
                    
                    setTimeout(() => {
                        actionButtons.style.opacity = "1";
                        actionButtons.style.transform = "translateY(0)";
                    }, 100);
                }
            }, 400);
        } else {
            // Fallback if calendar section doesn't exist
            if (statsSection) {
                statsSection.style.display = "block";
                statsSection.style.opacity = "1";
                statsSection.style.transform = "translateY(0)";
            }
            if (actionButtons) {
                actionButtons.style.display = "flex";
                actionButtons.style.opacity = "1";
                actionButtons.style.transform = "translateY(0)";
            }
        }
    }

    // Create calendar section
    createCalendarSection() {
        const section = document.createElement('div');
        section.className = 'calendar-section';
        section.innerHTML = `
            <div class="section-header">
                <h2>ক্যালেন্ডার ভিউ</h2>
                <div class="calendar-controls">
                    <button class="view-btn active" data-view="weekly">সাপ্তাহিক</button>
                    <button class="view-btn" data-view="monthly">মাসিক</button>
                    <button class="view-btn" data-view="weekly-chart">সাপ্তাহিক চার্ট</button>
                    <button class="view-btn" data-view="monthly-chart">মাসিক চার্ট</button>
                </div>
            </div>
            <div class="calendar-actions">
                <button class="btn btn-primary" onclick="calendarHandler.saveTodayData()">আজকের ডাটা সেভ করুন</button>
                <button class="btn btn-secondary" onclick="calendarHandler.showMainView()">হোমে ফিরে যান</button>
            </div>
            <div class="calendar-view">
                <div class="week-navigation" style="display: block;">
                    <button class="nav-btn" onclick="calendarHandler.changeWeek(-1)">‹</button>
                    <h3 id="currentWeek"></h3>
                    <button class="nav-btn" onclick="calendarHandler.changeWeek(1)">›</button>
                </div>
                <div class="month-navigation" style="display: none;">
                    <button class="nav-btn" onclick="calendarHandler.changeMonth(-1)">‹</button>
                    <h3 id="currentMonth"></h3>
                    <button class="nav-btn" onclick="calendarHandler.changeMonth(1)">›</button>
                </div>
                <div class="weekly-calendar" id="weeklyCalendar"></div>
                <div class="monthly-calendar" id="monthlyCalendar" style="display: none;"></div>
                <div class="charts-container" id="chartsContainer" style="display: none;">
                    <div class="chart-container">
                        <h3 id="chartTitle">সাপ্তাহিক পরিসংখ্যান</h3>
                        <div id="chartContent">
                            <div class="stats-summary" id="statsSummary"></div>
                            <div class="prayer-breakdown" id="prayerBreakdown"></div>
                        </div>
                    </div>
                </div>
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
            btn.addEventListener('click', () => {
                section.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const view = btn.dataset.view;
                this.currentView = view;
                
                // Hide all views first
                section.querySelector('.week-navigation').style.display = 'none';
                section.querySelector('.month-navigation').style.display = 'none';
                section.querySelector('#weeklyCalendar').style.display = 'none';
                section.querySelector('#monthlyCalendar').style.display = 'none';
                section.querySelector('#chartsContainer').style.display = 'none';
                
                if (view === 'weekly') {
                    section.querySelector('.week-navigation').style.display = 'block';
                    section.querySelector('#weeklyCalendar').style.display = 'grid';
                    this.renderWeeklyView();
                } else if (view === 'monthly') {
                    section.querySelector('.month-navigation').style.display = 'block';
                    section.querySelector('#monthlyCalendar').style.display = 'grid';
                    this.renderMonthlyView();
                } else if (view === 'weekly-chart') {
                    section.querySelector('#chartsContainer').style.display = 'block';
                    section.querySelector('#chartTitle').textContent = 'সাপ্তাহিক পরিসংখ্যান';
                    this.renderWeeklyStats();
                } else if (view === 'monthly-chart') {
                    section.querySelector('#chartsContainer').style.display = 'block';
                    section.querySelector('#chartTitle').textContent = 'মাসিক পরিসংখ্যান';
                    this.renderMonthlyStats();
                }
            });
        });
        
        return section;
    }

    // Change week
    changeWeek(direction) {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() + (direction * 7));
        this.renderWeeklyView();
    }

    // Change month
    changeMonth(direction) {
        this.currentMonthDate.setMonth(this.currentMonthDate.getMonth() + direction);
        this.renderMonthlyView();
    }

    // Render calendar view
    renderCalendarView() {
        if (this.currentView === 'weekly') {
            this.renderWeeklyView();
        } else {
            this.renderMonthlyView();
        }
    }

    // Render weekly view
    renderWeeklyView() {
        if (!this.currentUser) return;
        
        const weekElement = document.getElementById('currentWeek');
        const calendarElement = document.getElementById('weeklyCalendar');
        
        if (!weekElement || !calendarElement) return;
        
        // Update week header
        const weekEnd = new Date(this.currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const startStr = this.currentWeekStart.toLocaleDateString('bn-BD', options);
        const endStr = weekEnd.toLocaleDateString('bn-BD', options);
        weekElement.textContent = `${startStr} - ${endStr}`;
        
        // Clear calendar
        calendarElement.innerHTML = '';
        calendarElement.style.display = 'grid';
        calendarElement.style.gridTemplateColumns = 'repeat(7, 1fr)';
        
        // Generate week days
        for (let i = 0; i < 7; i++) {
            const date = new Date(this.currentWeekStart);
            date.setDate(date.getDate() + i);
            
            const dayElement = this.createDayElement(date);
            calendarElement.appendChild(dayElement);
        }
    }

    // Render monthly view
    renderMonthlyView() {
        if (!this.currentUser) return;
        
        const monthElement = document.getElementById('currentMonth');
        const calendarElement = document.getElementById('monthlyCalendar');
        
        if (!monthElement || !calendarElement) return;
        
        // Update month header
        const options = { year: 'numeric', month: 'long' };
        monthElement.textContent = this.currentMonthDate.toLocaleDateString('bn-BD', options);
        
        // Clear calendar
        calendarElement.innerHTML = '';
        calendarElement.style.display = 'grid';
        calendarElement.style.gridTemplateColumns = 'repeat(7, 1fr)';
        
        // Get first day of month and number of days
        const firstDay = new Date(this.currentMonthDate.getFullYear(), this.currentMonthDate.getMonth(), 1);
        const lastDay = new Date(this.currentMonthDate.getFullYear(), this.currentMonthDate.getMonth() + 1, 0);
        
        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyElement = document.createElement('div');
            emptyElement.className = 'calendar-day empty';
            calendarElement.appendChild(emptyElement);
        }
        
        // Add days of month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(this.currentMonthDate.getFullYear(), this.currentMonthDate.getMonth(), day);
            const dayElement = this.createDayElement(date);
            calendarElement.appendChild(dayElement);
        }
    }

    // Create day element
    createDayElement(date) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const storageKey = this.getUserStorageKey(`prayer-${dateKey}`);
        const dayData = localStorage.getItem(storageKey);
        
        let prayedCount = 0;
        let jamaatCount = 0;
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        
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
            <div class="day-number">${this.toBengaliNumber(date.getDate())}</div>
            <div class="day-prayers">${this.toBengaliNumber(prayedCount)}/৫ নামাজ</div>
        `;
        
        // Add click event listener for editing past data
        dayElement.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openEditModal(date, dateKey);
        });
        
        // Add cursor pointer style
        dayElement.style.cursor = 'pointer';
        
        return dayElement;
    }

    // Open edit modal for past prayer data
    openEditModal(date, dateKey) {
        if (!this.currentUser) return;
        
        // Remove existing modal if any
        const existingModal = document.querySelector('.edit-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const storageKey = this.getUserStorageKey(`prayer-${dateKey}`);
        const savedData = localStorage.getItem(storageKey);
        let data = {};
        
        if (savedData) {
            data = JSON.parse(savedData);
        }
        
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const prayerNames = {
            'fajr': 'ফজর',
            'dhuhr': 'জোহর', 
            'asr': 'আসর',
            'maghrib': 'মাগরিব',
            'isha': 'এশা'
        };
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'edit-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${date.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })} এর নামাজ এডিট করুন</h3>
                        <button class="modal-close" onclick="calendarHandler.closeEditModal()">&times;</button>
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
                        <button class="btn btn-primary" onclick="calendarHandler.saveEditedData('${dateKey}')">সেভ করুন</button>
                        <button class="btn btn-secondary" onclick="calendarHandler.closeEditModal()">বাতিল</button>
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
    closeEditModal() {
        const modal = document.querySelector('.edit-modal');
        if (modal) {
            modal.remove();
        }
    }

    // Save edited prayer data
    saveEditedData(dateKey) {
        if (!this.currentUser) return;
        
        const storageKey = this.getUserStorageKey(`prayer-${dateKey}`);
        
        // Get previous data for history logging
        const previousDataStr = localStorage.getItem(storageKey);
        let previousData = {};
        if (previousDataStr) {
            previousData = JSON.parse(previousDataStr);
        }
        
        const data = {};
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        
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
        this.logEditHistoryForPastDate(dateKey, previousData, data);
        
        // Re-render calendar view
        this.renderCalendarView();
        
        // Close modal
        this.closeEditModal();
        
        // Show success message
        this.showMessage('ডেটা সফলভাবে আপডেট হয়েছে!', 'success');
    }

    // Log edit history specifically for past date edits
    logEditHistoryForPastDate(dateKey, previousData, newData) {
        if (!this.currentUser) return;
        
        const historyKey = this.getUserStorageKey('edit-history');
        let history = [];
        
        // Get existing history
        const existingHistory = localStorage.getItem(historyKey);
        if (existingHistory) {
            history = JSON.parse(existingHistory);
        }
        
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const prayerNames = {
            'fajr': 'ফজর',
            'dhuhr': 'জোহর', 
            'asr': 'আসর',
            'maghrib': 'মাগরিব',
            'isha': 'এশা'
        };
        
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
                userId: this.currentUser.uid,
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

    // Render weekly stats
    renderWeeklyStats() {
        if (!this.currentUser) return;
        
        const summaryElement = document.getElementById('statsSummary');
        const breakdownElement = document.getElementById('prayerBreakdown');
        
        if (!summaryElement || !breakdownElement) return;
        
        // Calculate weekly stats
        const weekStats = this.calculateWeeklyStats();
        
        // Render summary
        summaryElement.innerHTML = `
            <div class="stats-card">
                <h4>এই সপ্তাহের সারসংক্ষেপ</h4>
                <div class="stat-row">
                    <span>মোট নামাজ পড়া হয়েছে:</span>
                    <span class="stat-value">${this.toBengaliNumber(weekStats.totalPrayed)}/৩৫</span>
                </div>
                <div class="stat-row">
                    <span>জামাতে পড়া হয়েছে:</span>
                    <span class="stat-value">${this.toBengaliNumber(weekStats.totalJamaat)}/৩৫</span>
                </div>
                <div class="stat-row">
                    <span>সম্পূর্ণতার হার:</span>
                    <span class="stat-value">${this.toBengaliNumber(Math.round((weekStats.totalPrayed / 35) * 100))}%</span>
                </div>
                <div class="stat-row">
                    <span>জামাতের হার:</span>
                    <span class="stat-value">${this.toBengaliNumber(Math.round((weekStats.totalJamaat / 35) * 100))}%</span>
                </div>
            </div>
        `;
        
        // Render prayer breakdown
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const prayerNames = {
            'fajr': 'ফজর',
            'dhuhr': 'জোহর', 
            'asr': 'আসর',
            'maghrib': 'মাগরিব',
            'isha': 'এশা'
        };
        
        let breakdownHTML = '<div class="prayer-stats"><h4>নামাজভিত্তিক পরিসংখ্যান</h4>';
        
        prayers.forEach(prayer => {
            const prayerStat = weekStats.prayers[prayer];
            const completionRate = Math.round((prayerStat.prayed / 7) * 100);
            const jamaatRate = Math.round((prayerStat.jamaat / 7) * 100);
            
            breakdownHTML += `
                <div class="prayer-stat-card">
                    <h5>${prayerNames[prayer]}</h5>
                    <div class="stat-bars">
                        <div class="stat-bar">
                            <span>পড়া হয়েছে: ${this.toBengaliNumber(prayerStat.prayed)}/৭</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${completionRate}%; background: var(--success-color);"></div>
                            </div>
                        </div>
                        <div class="stat-bar">
                            <span>জামাতে: ${this.toBengaliNumber(prayerStat.jamaat)}/৭</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${jamaatRate}%; background: var(--secondary-color);"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        breakdownHTML += '</div>';
        breakdownElement.innerHTML = breakdownHTML;
    }

    // Render monthly stats
    renderMonthlyStats() {
        if (!this.currentUser) return;
        
        const summaryElement = document.getElementById('statsSummary');
        const breakdownElement = document.getElementById('prayerBreakdown');
        
        if (!summaryElement || !breakdownElement) return;
        
        // Calculate monthly stats
        const monthStats = this.calculateMonthlyStats();
        const daysInMonth = new Date(this.currentMonthDate.getFullYear(), this.currentMonthDate.getMonth() + 1, 0).getDate();
        const totalPossible = daysInMonth * 5;
        
        // Render summary
        summaryElement.innerHTML = `
            <div class="stats-card">
                <h4>এই মাসের সারসংক্ষেপ</h4>
                <div class="stat-row">
                    <span>মোট নামাজ পড়া হয়েছে:</span>
                    <span class="stat-value">${this.toBengaliNumber(monthStats.totalPrayed)}/${this.toBengaliNumber(totalPossible)}</span>
                </div>
                <div class="stat-row">
                    <span>জামাতে পড়া হয়েছে:</span>
                    <span class="stat-value">${this.toBengaliNumber(monthStats.totalJamaat)}/${this.toBengaliNumber(totalPossible)}</span>
                </div>
                <div class="stat-row">
                    <span>সম্পূর্ণতার হার:</span>
                    <span class="stat-value">${this.toBengaliNumber(Math.round((monthStats.totalPrayed / totalPossible) * 100))}%</span>
                </div>
                <div class="stat-row">
                    <span>জামাতের হার:</span>
                    <span class="stat-value">${this.toBengaliNumber(Math.round((monthStats.totalJamaat / totalPossible) * 100))}%</span>
                </div>
            </div>
        `;
        
        // Render prayer breakdown
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const prayerNames = {
            'fajr': 'ফজর',
            'dhuhr': 'জোহর', 
            'asr': 'আসর',
            'maghrib': 'মাগরিব',
            'isha': 'এশা'
        };
        
        let breakdownHTML = '<div class="prayer-stats"><h4>নামাজভিত্তিক পরিসংখ্যান</h4>';
        
        prayers.forEach(prayer => {
            const prayerStat = monthStats.prayers[prayer];
            const completionRate = Math.round((prayerStat.prayed / daysInMonth) * 100);
            const jamaatRate = Math.round((prayerStat.jamaat / daysInMonth) * 100);
            
            breakdownHTML += `
                <div class="prayer-stat-card">
                    <h5>${prayerNames[prayer]}</h5>
                    <div class="stat-bars">
                        <div class="stat-bar">
                            <span>পড়া হয়েছে: ${this.toBengaliNumber(prayerStat.prayed)}/${this.toBengaliNumber(daysInMonth)}</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${completionRate}%; background: var(--success-color);"></div>
                            </div>
                        </div>
                        <div class="stat-bar">
                            <span>জামাতে: ${this.toBengaliNumber(prayerStat.jamaat)}/${this.toBengaliNumber(daysInMonth)}</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${jamaatRate}%; background: var(--secondary-color);"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        breakdownHTML += '</div>';
        breakdownElement.innerHTML = breakdownHTML;
    }

    // Calculate weekly stats
    calculateWeeklyStats() {
        const stats = {
            totalPrayed: 0,
            totalJamaat: 0,
            prayers: {
                fajr: { prayed: 0, jamaat: 0 },
                dhuhr: { prayed: 0, jamaat: 0 },
                asr: { prayed: 0, jamaat: 0 },
                maghrib: { prayed: 0, jamaat: 0 },
                isha: { prayed: 0, jamaat: 0 }
            }
        };
        
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        
        // Calculate for each day of the week
        for (let i = 0; i < 7; i++) {
            const date = new Date(this.currentWeekStart);
            date.setDate(date.getDate() + i);
            
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const storageKey = this.getUserStorageKey(`prayer-${dateKey}`);
            const dayData = localStorage.getItem(storageKey);
            
            if (dayData) {
                const data = JSON.parse(dayData);
                prayers.forEach(prayer => {
                    if (data[prayer]) {
                        if (data[prayer].prayed) {
                            stats.totalPrayed++;
                            stats.prayers[prayer].prayed++;
                        }
                        if (data[prayer].jamaat) {
                            stats.totalJamaat++;
                            stats.prayers[prayer].jamaat++;
                        }
                    }
                });
            }
        }
        
        return stats;
    }

    // Calculate monthly stats
    calculateMonthlyStats() {
        const stats = {
            totalPrayed: 0,
            totalJamaat: 0,
            prayers: {
                fajr: { prayed: 0, jamaat: 0 },
                dhuhr: { prayed: 0, jamaat: 0 },
                asr: { prayed: 0, jamaat: 0 },
                maghrib: { prayed: 0, jamaat: 0 },
                isha: { prayed: 0, jamaat: 0 }
            }
        };
        
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const daysInMonth = new Date(this.currentMonthDate.getFullYear(), this.currentMonthDate.getMonth() + 1, 0).getDate();
        
        // Calculate for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentMonthDate.getFullYear(), this.currentMonthDate.getMonth(), day);
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const storageKey = this.getUserStorageKey(`prayer-${dateKey}`);
            const dayData = localStorage.getItem(storageKey);
            
            if (dayData) {
                const data = JSON.parse(dayData);
                prayers.forEach(prayer => {
                    if (data[prayer]) {
                        if (data[prayer].prayed) {
                            stats.totalPrayed++;
                            stats.prayers[prayer].prayed++;
                        }
                        if (data[prayer].jamaat) {
                            stats.totalJamaat++;
                            stats.prayers[prayer].jamaat++;
                        }
                    }
                });
            }
        }
        
        return stats;
    }

    // Utility function to get Bengali numbers
    toBengaliNumber(num) {
        const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        return num.toString().replace(/\d/g, digit => bengaliDigits[digit]);
    }

    // Show message
    showMessage(message, type = 'success') {
        // Remove existing message if any
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.textContent = message;
        
        const main = document.querySelector('main') || document.querySelector('.container');
        if (main) {
            main.insertBefore(messageDiv, main.firstChild);
            
            setTimeout(() => {
                messageDiv.remove();
            }, 3000);
        }
    }

    // Save today's data
    saveTodayData() {
        if (!this.currentUser) {
            this.showMessage('অনুগ্রহ করে প্রথমে লগইন করুন।', 'error');
            return;
        }
        
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const storageKey = this.getUserStorageKey(`prayer-${todayKey}`);
        const data = {};
        
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        prayers.forEach(prayer => {
            const prayedCheckbox = document.getElementById(`${prayer}-prayed`);
            const jamaatCheckbox = document.getElementById(`${prayer}-jamaat`);
            
            if (prayedCheckbox && jamaatCheckbox) {
                data[prayer] = {
                    prayed: prayedCheckbox.checked,
                    jamaat: jamaatCheckbox.checked
                };
            }
        });
        
        localStorage.setItem(storageKey, JSON.stringify(data));
        this.showMessage('আজকের ডেটা সফলভাবে সেভ হয়েছে!', 'success');
        
        // Update calendar view if visible
        this.renderCalendarView();
    }
}

// Initialize calendar handler when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to be loaded
    setTimeout(() => {
        window.calendarHandler = new CalendarHandler();
    }, 1000);
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            window.calendarHandler = new CalendarHandler();
        }, 1000);
    });
} else {
    // DOM is already loaded
    setTimeout(() => {
        window.calendarHandler = new CalendarHandler();
    }, 1000);
}

