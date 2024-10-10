let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();
let currentContent = {};
let events = [];
let categories = [];
let selectedCategories = [];
let calendarData = [];

// Modify the loadCSVData function to include more logging
function loadCSVData() {
    return new Promise((resolve, reject) => {
        if (typeof Papa === 'undefined') {
            console.error('PapaParse is not loaded');
            reject(new Error('PapaParse is not loaded'));
            return;
        }

        Papa.parse('events.csv', {
            header: true,
            download: true,
            complete: function(results) {
                events = results.data;
                // Extract unique categories
                categories = [...new Set(events.map(event => event.Category))].sort();
                console.log('Extracted categories:', categories);
                populateCategoryFilter();
                console.log('CSV data loaded:', events);
                resolve(events);
            },
            error: function(error) {
                console.error('Error loading CSV data:', error);
                reject(error);
            }
        });
    });
}

// Replace the existing populateCategoryFilter function with this improved version
function populateCategoryFilter() {
    const categoryList = document.getElementById('category-list');
    const selectAllCheckbox = document.getElementById('select-all-categories');
    const selectedCountSpan = document.getElementById('selected-count');
    const searchInput = document.getElementById('category-search');

    categoryList.innerHTML = '';
    selectedCategories = [...categories]; // All categories selected by default

    categories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.innerHTML = `
            <label>
                <input type="checkbox" value="${category}" checked>
                <span>${category}</span>
            </label>
        `;
        categoryList.appendChild(categoryItem);
    });

    updateSelectedCount();

    // Event listener for individual category checkboxes
    categoryList.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            if (e.target.checked) {
                selectedCategories.push(e.target.value);
            } else {
                selectedCategories = selectedCategories.filter(cat => cat !== e.target.value);
            }
            updateSelectedCount();
            selectAllCheckbox.checked = selectedCategories.length === categories.length;
            renderCalendar(currentYear, currentMonth);
        }
    });

    // Event listener for "Select All" checkbox
    selectAllCheckbox.addEventListener('change', () => {
        const checkboxes = categoryList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
        selectedCategories = selectAllCheckbox.checked ? [...categories] : [];
        updateSelectedCount();
        renderCalendar(currentYear, currentMonth);
    });

    // Event listener for search input
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const categoryItems = categoryList.querySelectorAll('.category-item');
        categoryItems.forEach(item => {
            const categoryName = item.textContent.toLowerCase();
            item.style.display = categoryName.includes(searchTerm) ? 'block' : 'none';
        });
    });

    function updateSelectedCount() {
        selectedCountSpan.textContent = `${selectedCategories.length} of ${categories.length} selected`;
    }
}

function renderCalendar(year, month) {
    console.log("Rendering calendar for:", year, month);
    const calendarEl = document.getElementById('calendar');
    
    if (!calendarEl) {
        console.error("Calendar element not found");
        return;
    }

    calendarEl.innerHTML = ''; // Clear the calendar

    if (document.getElementById('week-view').classList.contains('active')) {
        renderWeekView(new Date(year, month, 1));
    } else {
        calendarEl.classList.remove('week-view');
        createCalendar(year, month);
        updateCalendarWithContent();
        updateCalendarWithEvents();
    }
    console.log("Calendar render complete");
}

function createCalendar(year, month) {
    console.log("Creating month calendar for", year, month);
    const calendar = document.getElementById('calendar');
    const weekNavigationEl = document.getElementById('week-navigation');
    calendar.classList.remove('week-view');
    calendar.classList.add('month-view');
    weekNavigationEl.style.display = 'none';

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    console.log("Days in month:", daysInMonth, "Starting day:", startingDay);

    // Create calendar cells
    for (let i = 0; i < 42; i++) {
        const cell = document.createElement('div');
        cell.classList.add('calendar-cell');

        if (i >= startingDay && i < startingDay + daysInMonth) {
            const day = i - startingDay + 1;
            cell.textContent = day;
            
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split('T')[0];
            cell.setAttribute('data-date', dateString);

            if (date.toDateString() === new Date().toDateString()) {
                cell.classList.add('current-day');
            }

            // Add click event to open modal for adding content
            cell.addEventListener('click', (e) => {
                console.log('Cell clicked:', dateString);
                if (e.target === cell) {
                    openModal(null, cell);
                }
            });
        } else {
            cell.classList.add('empty-cell');
        }

        calendar.appendChild(cell);
    }

    console.log("Month calendar created");
}

// Modify the createDayElement function to allow adding content on click
function createDayElement(day) {
    const dayElement = document.createElement('div');
    dayElement.className = 'day';
    
    // Check if this day is today
    const today = new Date();
    if (day === today.getDate() && 
        currentDate.getMonth() === today.getMonth() && 
        currentDate.getFullYear() === today.getFullYear()) {
        dayElement.classList.add('current-day');
    }
    
    dayElement.innerHTML = `<div class="day-number">${day}</div>`;

    // Add click event to add content
    dayElement.addEventListener('click', () => openModal(null, dayElement));

    return dayElement;
}

function createPlaceholder(content) {
    const placeholder = document.createElement('div');
    placeholder.className = `content-placeholder ${content.platform}`;
    
    const contentPreview = content.content ? content.content.split(' ').slice(0, 10).join(' ') : 'New content';
    const truncatedContent = contentPreview.length > 50 ? contentPreview.substring(0, 50) + '...' : contentPreview;
    
    placeholder.innerHTML = `
        <span class="platform-icon">${getPlatformIcon(content.platform)}</span>
        <span class="content-preview">${truncatedContent}</span>
        <button class="remove-placeholder">&times;</button>
    `;
    placeholder.draggable = true;
    placeholder.dataset.platform = content.platform;
    placeholder.dataset.content = content.content;
    placeholder.dataset.description = content.description || '';
    placeholder.dataset.postTime = content.postTime || '';
    placeholder.dataset.approvalStatus = content.approvalStatus || 'Draft';
    placeholder.addEventListener('click', (e) => {
        if (!e.target.classList.contains('remove-placeholder')) {
            openModal(content);
        }
    });
    placeholder.addEventListener('dragstart', dragStart);

    const removeButton = placeholder.querySelector('.remove-placeholder');
    removeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        removePlaceholder(placeholder, content);
    });

    return placeholder;
}

function getPlatformIcon(platform) {
    const icons = {
        facebook: '📘',
        instagram: '📷',
        twitter: '🐦',
        linkedin: '💼',
        tiktok: '🎵',
        threads: '🧵'
    };
    return icons[platform.toLowerCase()] || '📱';
}

function removePlaceholder(placeholder, content) {
    const dayElement = placeholder.closest('.day') || placeholder.closest('.calendar-cell');
    if (dayElement) {
        const dateKey = dayElement.getAttribute('data-date');
        if (dateKey && currentContent[dateKey]) {
            currentContent[dateKey] = currentContent[dateKey].filter(c => c !== content);
        }
    }
    placeholder.remove();
    updateContentData();
}

function setupDragAndDrop() {
    const draggables = document.querySelectorAll('.content-placeholder');
    const dropZones = document.querySelectorAll('.day');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', dragStart);
    });

    dropZones.forEach(dropZone => {
        dropZone.addEventListener('dragover', dragOver);
        dropZone.addEventListener('drop', drop);
    });
}

function dragStart(e) {
    e.dataTransfer.setData('text/plain', JSON.stringify({
        outerHTML: e.target.outerHTML,
        content: currentContent[getDateKeyFromDay(e.target.closest('.day'))].find(c => c.platform === e.target.classList[1])
    }));
    setTimeout(() => e.target.style.display = 'none', 0);
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const draggedElement = document.createElement('div');
    draggedElement.innerHTML = data.outerHTML;
    const content = draggedElement.firstChild;
    
    e.target.closest('.day').appendChild(content);
    content.style.display = 'block';
    
    // Update the content data for the new day
    const newDateKey = getDateKeyFromDay(e.target.closest('.day'));
    if (!currentContent[newDateKey]) {
        currentContent[newDateKey] = [];
    }
    currentContent[newDateKey].push(data.content);
    
    // Remove the content from the old day
    const oldDateKey = getDateKeyFromDay(document.querySelector(`[style="display: none;"]`).closest('.day'));
    currentContent[oldDateKey] = currentContent[oldDateKey].filter(c => c !== data.content);
    
    document.querySelector(`[style="display: none;"]`).remove();
    
    updateContentData();
}

function openModal(content = null, cell = null) {
    console.log('Opening modal:', content, cell);
    const modal = document.getElementById('modal');
    const form = document.getElementById('content-form');
    const platformSelect = document.getElementById('platform');
    const contentTextarea = document.getElementById('content');
    const descriptionTextarea = document.getElementById('description');
    const postTimeInput = document.getElementById('postTime');
    const approvalStatusSelect = document.getElementById('approvalStatus');
    const deleteButton = document.getElementById('delete-content');

    let editingContentId = null;

    if (content) {
        // Editing existing content
        editingContentId = content.id;
        platformSelect.value = content.platform;
        contentTextarea.value = content.content;
        descriptionTextarea.value = content.description || '';
        postTimeInput.value = content.postTime || '';
        approvalStatusSelect.value = content.approvalStatus || 'Draft';
        deleteButton.style.display = 'block';
    } else {
        // Adding new content
        form.reset();
        deleteButton.style.display = 'none';
    }

    modal.style.display = 'block';

    form.onsubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted');
        const newContent = {
            id: editingContentId || Date.now().toString(),
            date: cell ? cell.getAttribute('data-date') : content.date,
            platform: platformSelect.value,
            content: contentTextarea.value,
            description: descriptionTextarea.value,
            postTime: postTimeInput.value,
            approvalStatus: approvalStatusSelect.value
        };

        if (editingContentId) {
            // Update existing content
            const index = calendarData.findIndex(item => item.id === editingContentId);
            if (index !== -1) {
                calendarData[index] = newContent;
            }
        } else {
            // Add new content
            calendarData.push(newContent);
        }

        localStorage.setItem('calendarData', JSON.stringify(calendarData));
        closeModal();
        renderCalendar(currentYear, currentMonth);
    };

    deleteButton.onclick = () => {
        console.log('Delete button clicked');
        if (editingContentId) {
            calendarData = calendarData.filter(item => item.id !== editingContentId);
            localStorage.setItem('calendarData', JSON.stringify(calendarData));
        }
        closeModal();
        renderCalendar(currentYear, currentMonth);
    };
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}

// Add event listener to close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target == modal) {
        closeModal();
    }
};

function updateContentData() {
    // This function should update currentContent based on the DOM
    // and then save to localStorage
    saveToLocalStorage();
}

function saveToLocalStorage() {
    localStorage.setItem('contentCalendar', JSON.stringify(currentContent));
    console.log("Saved to localStorage:", currentContent);
}

function loadFromLocalStorage() {
    const savedContent = localStorage.getItem('contentCalendar');
    if (savedContent) {
        currentContent = JSON.parse(savedContent);
    }
}

function resetCalendar() {
    localStorage.removeItem('contentCalendar');
    localStorage.removeItem('calendarData');
    currentContent = {};
    calendarData = []; // Clear the calendarData array
    const calendarElement = document.getElementById('calendar');
    if (calendarElement) {
        calendarElement.innerHTML = ''; // Clear the calendar HTML
    }
    renderCalendar(currentYear, currentMonth);
    console.log("Calendar reset complete");
}

const resetButton = document.getElementById('reset-button');
const warningModal = document.getElementById('warning-modal');
const confirmResetButton = document.getElementById('confirm-reset');
const cancelResetButton = document.getElementById('cancel-reset');

resetButton.addEventListener('click', () => {
    warningModal.style.display = 'block';
});

confirmResetButton.addEventListener('click', () => {
    resetCalendar();
    warningModal.style.display = 'none';
});

cancelResetButton.addEventListener('click', () => {
    warningModal.style.display = 'none';
});

document.getElementById('prev-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    updateDatePicker();
});

document.getElementById('next-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    updateDatePicker();
});

document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('modal').style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal')) {
        document.getElementById('modal').style.display = 'none';
    }
    if (e.target === warningModal) {
        warningModal.style.display = 'none';
    }
});

loadFromLocalStorage();
renderCalendar();

const datePicker = document.getElementById('date-picker');
datePicker.addEventListener('change', (e) => {
    jumpToDate(e.target.value);
});

function updateDatePicker() {
    const datePicker = document.getElementById('date-picker');
    datePicker.value = currentDate.toISOString().split('T')[0];
}

function jumpToDate(dateString) {
    currentDate = new Date(dateString);
    renderCalendar();
}

function jumpToToday() {
    currentDate = new Date();
    renderCalendar();
}

const todayButton = document.getElementById('today-button');
todayButton.addEventListener('click', jumpToToday);

// Add these functions to your existing script.js file

function autoPopulateCalendar() {
    // Clear existing calendar data before auto-populating
    calendarData = [];
    
    const postsPerWeek = parseInt(document.getElementById('posts-per-week').value);
    const totalPosts = parseInt(document.getElementById('total-posts').value);
    const allowWeekends = document.getElementById('allow-weekends').checked;
    const distribution = document.getElementById('distribution').value;

    let availableDays = [];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentYear, currentMonth, i);
        if (allowWeekends || (date.getDay() !== 0 && date.getDay() !== 6)) {
            availableDays.push(i);
        }
    }

    let postDays = distributePostDays(availableDays, totalPosts, distribution);

    postDays.forEach(day => {
        const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const newContent = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            date: dateString,
            platform: getRandomPlatform(),
            content: 'Auto-generated content',
            description: '',
            postTime: '',
            approvalStatus: 'Draft'
        };
        calendarData.push(newContent);
    });

    localStorage.setItem('calendarData', JSON.stringify(calendarData));
    renderCalendar(currentYear, currentMonth);
}

function distributePostDays(availableDays, totalPosts, distribution) {
    if (distribution === 'even') {
        return distributeEvenly(availableDays, totalPosts);
    } else if (distribution === 'front-loaded') {
        return availableDays.slice(0, totalPosts);
    } else {
        return availableDays.slice(-totalPosts);
    }
}

function distributeEvenly(availableDays, totalPosts) {
    const interval = Math.floor(availableDays.length / totalPosts);
    return availableDays.filter((_, index) => index % interval === 0).slice(0, totalPosts);
}

function getRandomPlatform() {
    const platforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'threads'];
    return platforms[Math.floor(Math.random() * platforms.length)];
}

// Add this event listener at the end of your script
document.getElementById('auto-populate-button').addEventListener('click', autoPopulateCalendar);

function openEventModal(event) {
    const modal = document.getElementById('event-modal');
    document.getElementById('event-title').textContent = event.Subject;
    document.getElementById('event-category').textContent = event.Category;
    document.getElementById('event-subcategory').textContent = event.Subcategory;
    document.getElementById('event-location').textContent = event.Location;
    document.getElementById('event-date').textContent = `${event['Start Date']} - ${event['End Date']}`;
    document.getElementById('event-notes').textContent = event.Notes;
    document.getElementById('event-description').textContent = event.Description;
    const urlElement = document.getElementById('event-url');
    urlElement.href = event.URL;
    urlElement.textContent = event.URL;
    modal.style.display = 'block';

    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

// Add this function to handle the auto-populate toggle
function setupAutoPopulateToggle() {
    const toggleButton = document.getElementById('toggle-auto-populate');
    const controls = document.getElementById('auto-populate-controls');
    
    toggleButton.addEventListener('click', function() {
        if (controls.style.display === 'none') {
            controls.style.display = 'block';
            this.textContent = 'Hide';
        } else {
            controls.style.display = 'none';
            this.textContent = 'Show';
        }
    });
}

// Modify the window.onload function
window.onload = async function() {
    console.log("Window loaded");
    await loadCategories();
    setupEventListeners();
    toggleView();
    
    // Initialize calendarData
    calendarData = [];
    
    // Only load calendar data if it exists and is not empty
    const savedCalendarData = localStorage.getItem('calendarData');
    if (savedCalendarData && savedCalendarData !== '[]') {
        calendarData = JSON.parse(savedCalendarData);
    }
    
    currentDate = new Date();
    currentYear = currentDate.getFullYear();
    currentMonth = currentDate.getMonth();
    console.log("Current date:", currentDate);
    renderCalendar(currentYear, currentMonth);
    updateCurrentMonthDisplay();
    console.log("Initial calendar render complete");
}

// Make sure the autoPopulateCalendar function is defined
function autoPopulateCalendar() {
    // ... (keep existing auto-populate logic) ...
}

// Add this event listener for the auto-populate button
document.getElementById('auto-populate-button').addEventListener('click', autoPopulateCalendar);

// Helper functions to get colors for platforms and categories
function getPlatformColor(platform) {
    const colors = {
        facebook: '#3b5998',
        instagram: '#e1306c',
        twitter: '#1da1f2',
        linkedin: '#0077b5',
        tiktok: '#000000',
        threads: '#000000'
    };
    return colors[platform.toLowerCase()] || '#999999';
}

function getCategoryColor(category) {
    const colors = {
        'Holiday': '#ff9999',
        'Event': '#99ff99',
        'Promotion': '#9999ff',
        // Add more categories and colors as needed
    };
    return colors[category] || '#cccccc';
}

// Make sure to call createCalendar() when updating the calendar

// Add this function to toggle between month and week views
function toggleView() {
    const monthViewBtn = document.getElementById('month-view');
    const weekViewBtn = document.getElementById('week-view');

    monthViewBtn.addEventListener('click', () => {
        monthViewBtn.classList.add('active');
        weekViewBtn.classList.remove('active');
        renderCalendar(currentYear, currentMonth);
    });

    weekViewBtn.addEventListener('click', () => {
        weekViewBtn.classList.add('active');
        monthViewBtn.classList.remove('active');
        renderWeekView(new Date(currentYear, currentMonth, 1));
    });
}

// Add this function to render the week view
function renderWeekView(date) {
    console.log("Rendering week view for:", date);
    const calendarEl = document.getElementById('calendar');
    const weekNavigationEl = document.getElementById('week-navigation');
    calendarEl.innerHTML = '';
    calendarEl.classList.remove('month-view');
    calendarEl.classList.add('week-view');
    weekNavigationEl.style.display = 'flex';

    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    for (let i = 0; i < 7; i++) {
        const dayEl = document.createElement('div');
        dayEl.classList.add('calendar-cell', 'week-day');
        const currentDate = new Date(weekStart);
        currentDate.setDate(weekStart.getDate() + i);
        
        const dateString = currentDate.toISOString().split('T')[0];
        dayEl.setAttribute('data-date', dateString);

        const dayHeader = document.createElement('div');
        dayHeader.classList.add('day-header');

        const dayNumber = document.createElement('div');
        dayNumber.classList.add('day-number');
        dayNumber.textContent = currentDate.getDate();

        const dayName = document.createElement('div');
        dayName.classList.add('day-name');
        dayName.textContent = currentDate.toLocaleDateString('en-US', { weekday: 'short' });

        dayHeader.appendChild(dayNumber);
        dayHeader.appendChild(dayName);
        dayEl.appendChild(dayHeader);

        const dayContent = document.createElement('div');
        dayContent.classList.add('day-content');
        dayEl.appendChild(dayContent);

        if (currentDate.toDateString() === new Date().toDateString()) {
            dayEl.classList.add('current-day');
        }

        calendarEl.appendChild(dayEl);

        // Add content placeholders and CSV calendar events
        updateDayWithContent(dayContent, dateString);
        updateDayWithEvents(dayContent, currentDate);
    }

    // Update week range display
    document.getElementById('week-range').textContent = `${weekStart.toDateString()} - ${weekEnd.toDateString()}`;

    console.log("Week view render complete");
}

// Helper functions to update day content and events
function updateDayWithContent(dayElement, dateString) {
    if (calendarData) {
        const dayContent = calendarData.filter(content => content.date === dateString);
        dayContent.forEach(content => {
            const placeholder = createPlaceholder(content);
            dayElement.appendChild(placeholder);
        });
    }
}

function updateDayWithEvents(dayElement, date) {
    const dayEvents = events.filter(event => {
        const eventDate = new Date(event['Start Date']);
        return eventDate.toDateString() === date.toDateString() &&
               selectedCategories.includes(event.Category);
    });

    dayEvents.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'calendar-event';
        eventElement.innerHTML = `
            <div class="event-title">${event.Subject}</div>
            <div class="event-category">${event.Category}</div>
        `;
        eventElement.style.backgroundColor = getCategoryColor(event.Category);
        eventElement.addEventListener('click', (e) => {
            e.stopPropagation();
            openEventModal(event);
        });
        dayElement.appendChild(eventElement);
    });
}

// Add this function to handle week navigation
function navigateWeek(direction) {
    const weekRange = document.getElementById('week-range').textContent;
    const weekStart = new Date(weekRange.split(' - ')[0]);
    weekStart.setDate(weekStart.getDate() + (7 * direction));
    renderWeekView(weekStart);
}

// Add event listeners for week navigation
document.getElementById('prev-week').addEventListener('click', () => navigateWeek(-1));
document.getElementById('next-week').addEventListener('click', () => navigateWeek(1));

// Update the saveContent function to fix the save issue
function saveContent(e) {
    e.preventDefault();
    const form = document.getElementById('content-form');
    const formData = new FormData(form);
    const content = Object.fromEntries(formData.entries());

    content.date = selectedDate;

    // Check if we're editing an existing content or adding a new one
    if (editingContentId) {
        const index = calendarData.findIndex(item => item.id === editingContentId);
        if (index !== -1) {
            calendarData[index] = { ...calendarData[index], ...content };
        }
    } else {
        content.id = Date.now().toString();
        calendarData.push(content);
    }

    localStorage.setItem('calendarData', JSON.stringify(calendarData));
    closeModal();
    renderCalendar(currentMonth, currentYear);
}

// Update the autoPopulateCalendar function to fix the auto-populate issue
function autoPopulateCalendar() {
    const postsPerWeek = parseInt(document.getElementById('posts-per-week').value);
    const totalPosts = parseInt(document.getElementById('total-posts').value);
    const allowWeekends = document.getElementById('allow-weekends').checked;
    const distribution = document.getElementById('distribution').value;

    let availableDays = [];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentYear, currentMonth, i);
        if (allowWeekends || (date.getDay() !== 0 && date.getDay() !== 6)) {
            availableDays.push(i);
        }
    }

    let selectedDays = [];
    if (distribution === 'even') {
        const step = Math.floor(availableDays.length / totalPosts);
        for (let i = 0; i < totalPosts; i++) {
            selectedDays.push(availableDays[i * step]);
        }
    } else if (distribution === 'front-loaded') {
        selectedDays = availableDays.slice(0, totalPosts);
    } else if (distribution === 'back-loaded') {
        selectedDays = availableDays.slice(-totalPosts);
    }

    selectedDays.forEach(day => {
        const content = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            date: `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
            platform: 'facebook',
            content: 'Auto-generated content',
            description: '',
            postTime: '12:00',
            approvalStatus: 'Draft'
        };
        calendarData.push(content);
    });

    localStorage.setItem('calendarData', JSON.stringify(calendarData));
    renderCalendar(currentMonth, currentYear);
}

// Add event listeners for the new view toggle buttons
document.addEventListener('DOMContentLoaded', function() {
    // ... (existing event listeners) ...

    toggleView();
});

function updateCalendarWithContent() {
    console.log("Updating calendar with content");
    const calendarCells = document.querySelectorAll('.calendar-cell');
    
    calendarCells.forEach(cell => {
        const dateString = cell.getAttribute('data-date');
        if (dateString && calendarData && calendarData.length > 0) {
            const cellContent = calendarData.filter(content => content.date === dateString);
            cellContent.forEach(content => {
                const placeholder = createPlaceholder(content);
                cell.appendChild(placeholder);
            });
        }
    });
}

function updateCalendarWithEvents() {
    console.log("Updating calendar with events");
    const calendarCells = document.querySelectorAll('.calendar-cell');
    
    calendarCells.forEach(cell => {
        const dateString = cell.getAttribute('data-date');
        if (dateString) {
            const cellDate = new Date(dateString);
            const cellEvents = events.filter(event => {
                const eventDate = new Date(event['Start Date']);
                return eventDate.toDateString() === cellDate.toDateString() &&
                       selectedCategories.includes(event.Category);
            });

            cellEvents.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'calendar-event';
                eventElement.innerHTML = `
                    <div class="event-title">${event.Subject}</div>
                    <div class="event-category">${event.Category}</div>
                `;
                eventElement.style.backgroundColor = getCategoryColor(event.Category);
                eventElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openEventModal(event);
                });
                cell.appendChild(eventElement);
            });
        }
    });
}

async function loadCategories() {
    try {
        await loadCSVData();
        populateCategoryFilter();
    } catch (error) {
        console.error("Error loading categories:", error);
    }
}

function setupEventListeners() {
    document.getElementById('prev-month').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentYear, currentMonth);
        updateCurrentMonthDisplay();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentYear, currentMonth);
        updateCurrentMonthDisplay();
    });

    document.getElementById('today-button').addEventListener('click', () => {
        const today = new Date();
        currentYear = today.getFullYear();
        currentMonth = today.getMonth();
        renderCalendar(currentYear, currentMonth);
        updateCurrentMonthDisplay();
    });

    // Setup auto-populate toggle
    setupAutoPopulateToggle();
}

function updateCurrentMonthDisplay() {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    document.getElementById('current-month').textContent = `${monthNames[currentMonth]} ${currentYear}`;
}