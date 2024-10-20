let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();
let currentContent = {};
let events = [];
let categories = [];
let selectedCategories = [];
let calendarData = [];
let holidays = [];
let observances = [];
let selectedHolidays = [];
let selectedObservances = [];;

// At the beginning of the file, add this function
function logState() {
    console.log("Current state:");
    console.log("Events:", events.length);
    console.log("Holidays:", holidays.length);
    console.log("Observances:", observances.length);
    console.log("Selected Categories:", selectedCategories);
    console.log("Selected Holidays:", selectedHolidays);
    console.log("Selected Observances:", selectedObservances);
}

// Remove the parseDate function and modify the loadCSVData function
function loadCSVData() {
    return Promise.all([
        new Promise((resolve, reject) => {
            Papa.parse('events.csv', {
                header: true,
                download: true,
                complete: function(results) {
                    events = results.data;
                    console.log('Loaded events:', events.length);
                    if (events.length > 0) {
                        console.log('Sample event:', events[0]);
                    }
                    resolve();
                },
                error: reject
            });
        }),
        new Promise((resolve, reject) => {
            Papa.parse('Holidays.csv', {
                header: true,
                download: true,
                complete: function(results) {
                    holidays = results.data;
                    console.log('Loaded holidays:', holidays.length);
                    resolve();
                },
                error: reject
            });
        }),
        new Promise((resolve, reject) => {
            Papa.parse('Observances.csv', {
                header: true,
                download: true,
                complete: function(results) {
                    observances = results.data;
                    console.log('Loaded observances:', observances.length);
                    resolve();
                },
                error: reject
            })
        })
    ]).then(() => {
        categories = [...new Set(events.map(event => event.Category))].sort();
        console.log('Categories:', categories);
        populateCategoryFilter();
        console.log('All CSV data loaded');
        logState();
    }).catch(error => {
        console.error('Error loading CSV data:', error);
    });
}

// Modify the populateCategoryFilter function
function populateCategoryFilter() {
    const categoryList = document.getElementById('category-list');
    const selectAllCheckbox = document.getElementById('select-all-categories');
    const selectedCountSpan = document.getElementById('selected-count');
    const searchInput = document.getElementById('category-search');

    // Clear existing categories
    document.querySelector('.category-group:nth-child(1) .subcategory-list').innerHTML = '';
    document.querySelector('.category-group:nth-child(2) .subcategory-list').innerHTML = '';
    document.querySelector('.category-group:nth-child(3) .subcategory-list').innerHTML = '';

    selectedCategories = [];
    selectedHolidays = [];
    selectedObservances = [];

    // Add event categories
    categories.forEach(category => {
        const categoryItem = createCategoryItem(category, false, 'event');
        document.querySelector('.category-group:nth-child(1) .subcategory-list').appendChild(categoryItem);
    });

    // Add holiday categories
    const holidayCategories = [...new Set(holidays.map(holiday => holiday.Category))].sort();
    holidayCategories.forEach(category => {
        const categoryItem = createCategoryItem(category, false, 'holiday');
        document.querySelector('.category-group:nth-child(2) .subcategory-list').appendChild(categoryItem);
    });

    // Add observance categories
    const observanceCategories = [...new Set(observances.map(observance => observance.Category))].sort();
    observanceCategories.forEach(category => {
        const categoryItem = createCategoryItem(category, false, 'observance');
        document.querySelector('.category-group:nth-child(3) .subcategory-list').appendChild(categoryItem);
    });

    // Add observance subcategories
    const observanceSubcategories = [...new Set(observances.map(observance => observance.Subcategory).filter(Boolean))].sort();
    observanceSubcategories.forEach(subcategory => {
        const categoryItem = createCategoryItem(subcategory, false, 'observance-sub');
        document.querySelector('.category-group:nth-child(3) .subcategory-list').appendChild(categoryItem);
    });

    updateSelectedCount();

    console.log("Categories populated. Selected:", selectedCategories, selectedHolidays, selectedObservances);

    // Event listener for category checkboxes
    categoryList.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const value = e.target.value;
            const isChecked = e.target.checked;
            const type = e.target.dataset.type;
            updateSelectedCategories(value, isChecked, type);
            updateSelectedCount();
            selectAllCheckbox.checked = isEverythingSelected();
            renderCalendar(currentYear, currentMonth);
        }
    });

    // Event listener for "Select All" checkbox
    selectAllCheckbox.addEventListener('change', () => {
        const checkboxes = categoryList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
            updateSelectedCategories(checkbox.value, selectAllCheckbox.checked, checkbox.dataset.type);
        });
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

    // Add event listeners for category group toggles
    document.querySelectorAll('.category-group h4').forEach(header => {
        header.addEventListener('click', () => {
            const subcategoryList = header.nextElementSibling;
            subcategoryList.style.display = subcategoryList.style.display === 'none' ? 'block' : 'none';
            header.querySelector('.toggle-icon').textContent = subcategoryList.style.display === 'none' ? '▶' : '▼';
        });
    });
}

function updateSelectedCategories(value, isChecked, type) {
    if (type === 'holiday') {
        if (isChecked) {
            selectedHolidays.push(value);
        } else {
            selectedHolidays = selectedHolidays.filter(cat => cat !== value);
        }
    } else if (type === 'observance' || type === 'observance-sub') {
        if (isChecked) {
            selectedObservances.push(value);
        } else {
            selectedObservances = selectedObservances.filter(cat => cat !== value);
        }
    } else {
        if (isChecked) {
            selectedCategories.push(value);
        } else {
            selectedCategories = selectedCategories.filter(cat => cat !== value);
        }
    }
    
    // Update the calendar view without changing the current date
    if (document.getElementById('week-view').classList.contains('active')) {
        renderWeekView(currentDate);
    } else {
        renderCalendar(currentYear, currentMonth);
    }
}

function updateSelectedCount() {
    const totalCount = categories.length + 
                       [...new Set(holidays.map(holiday => holiday.Category))].length + 
                       [...new Set(observances.map(observance => observance.Category))].length + 
                       [...new Set(observances.map(observance => observance.Subcategory).filter(Boolean))].length;
    const selectedCount = selectedCategories.length + selectedHolidays.length + selectedObservances.length;
    document.getElementById('selected-count').textContent = `${selectedCount} of ${totalCount} selected`;
}

function isEverythingSelected() {
    return selectedCategories.length === categories.length &&
           selectedHolidays.length === [...new Set(holidays.map(holiday => holiday.Category))].length &&
           selectedObservances.length === ([...new Set(observances.map(observance => observance.Category))].length +
                                           [...new Set(observances.map(observance => observance.Subcategory).filter(Boolean))].length);
}

function createCategoryItem(category, checked, type) {
    const categoryItem = document.createElement('div');
    categoryItem.className = 'category-item';
    categoryItem.innerHTML = `
        <label>
            <input type="checkbox" value="${category}" ${checked ? 'checked' : ''} data-type="${type}">
            <span>${category}</span>
        </label>
    `;
    return categoryItem;
}

// Modify the renderCalendar function
function renderCalendar(year, month) {
    console.log("Rendering calendar for:", year, month);
    logState();
    const calendarEl = document.getElementById('calendar');
    
    if (!calendarEl) {
        console.error("Calendar element not found");
        return;
    }

    calendarEl.innerHTML = ''; // Clear the calendar

    if (document.getElementById('week-view').classList.contains('active')) {
        renderWeekView(currentDate); // Use currentDate instead of creating a new date
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

    const today = new Date();

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

            if (date.toDateString() === today.toDateString()) {
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
    const newDate = new Date(dateString);
    if (isNaN(newDate.getTime())) {
        console.error("Invalid date selected:", dateString);
        return;
    }
    currentDate = newDate;
    currentYear = currentDate.getFullYear();
    currentMonth = currentDate.getMonth();
    if (document.getElementById('week-view').classList.contains('active')) {
        renderWeekView(currentDate);
    } else {
        renderCalendar(currentYear, currentMonth);
    }
    updateDatePicker();
}

// Modify the jumpToToday function
function jumpToToday() {
    currentDate = new Date();
    currentYear = currentDate.getFullYear();
    currentMonth = currentDate.getMonth();
    if (document.getElementById('week-view').classList.contains('active')) {
        renderWeekView(currentDate);
    } else {
        renderCalendar(currentYear, currentMonth);
    }
    updateDatePicker();
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

function openEventModal(item) {
    const modal = document.getElementById('event-modal');
    const title = document.getElementById('event-title');
    const category = document.getElementById('event-category');
    const subcategory = document.getElementById('event-subcategory');
    const location = document.getElementById('event-location');
    const date = document.getElementById('event-date');
    const notes = document.getElementById('event-notes');
    const description = document.getElementById('event-description');
    const url = document.getElementById('event-url');

    title.textContent = item.Subject;
    category.textContent = item.Category;
    subcategory.textContent = item.Subcategory || 'N/A';
    location.textContent = item.Location || 'N/A';
    date.textContent = item['Start Date'];
    notes.textContent = item.Notes || 'N/A';
    description.textContent = item.Description || 'N/A';
    
    if (item.URL) {
        url.href = item.URL;
        url.textContent = item.URL;
        url.style.display = 'inline';
    } else {
        url.style.display = 'none';
    }

    modal.style.display = 'block';

    // Close the modal when clicking on the close button or outside the modal
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
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.error("Invalid date for week view:", date);
        date = new Date(); // Fallback to current date
    }
    currentDate = new Date(date); // Update currentDate
    currentYear = currentDate.getFullYear();
    currentMonth = currentDate.getMonth();
    
    console.log("Current events:", events);
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

    const weekGrid = document.createElement('div');
    weekGrid.classList.add('calendar-grid', 'week-view');
    calendarEl.appendChild(weekGrid);

    const today = new Date();

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

        if (currentDate.toDateString() === today.toDateString()) {
            dayEl.classList.add('current-day');
        }

        weekGrid.appendChild(dayEl);

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
        // Check if 'Start Date' exists and is a valid date string
        if (!event['Start Date'] || typeof event['Start Date'] !== 'string') {
            console.warn('Invalid Start Date for event:', event);
            return false;
        }
        const eventDate = new Date(event['Start Date']);
        if (isNaN(eventDate.getTime())) {
            console.warn('Invalid date string for event:', event);
            return false;
        }
        return eventDate.toDateString() === date.toDateString() &&
               selectedCategories.includes(event.Category);
    });

    dayEvents.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'calendar-event';
        eventElement.innerHTML = `
            <div class="event-title">${event.Subject || 'Untitled Event'}</div>
            <div class="event-category">${event.Category || 'Uncategorized'}</div>
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
    currentDate.setDate(currentDate.getDate() + (7 * direction));
    renderWeekView(currentDate);
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

// Modify the updateCalendarWithEvents function
function updateCalendarWithEvents() {
    console.log("Updating calendar with events, holidays, and observances");
    logState();
    
    const calendarCells = document.querySelectorAll('.calendar-cell');
    
    calendarCells.forEach(cell => {
        const dateString = cell.getAttribute('data-date');
        if (dateString) {
            const cellDate = new Date(dateString);
            console.log("Processing cell date:", cellDate);
            
            // Add events
            const cellEvents = events.filter(event => {
                const eventDate = new Date(event['Start Date']);
                eventDate.setDate(eventDate.getDate() - 1); // Subtract one day
                const match = eventDate.toDateString() === cellDate.toDateString() &&
                       selectedCategories.includes(event.Category);
                if (match) {
                    console.log("Matched event:", event);
                }
                return match;
            });

            console.log(`Cell ${dateString} events:`, cellEvents.length);

            // Add holidays
            const cellHolidays = holidays.filter(holiday => {
                const holidayDate = new Date(holiday['Start Date']);
                holidayDate.setDate(holidayDate.getDate() - 1); // Subtract one day
                const match = holidayDate.toDateString() === cellDate.toDateString() &&
                       selectedHolidays.includes(holiday.Category);
                if (match) {
                    console.log("Matched holiday:", holiday);
                }
                return match;
            });

            console.log(`Cell ${dateString} holidays:`, cellHolidays.length);

            // Add observances
            const cellObservances = observances.filter(observance => {
                const observanceDate = new Date(observance['Start Date']);
                observanceDate.setDate(observanceDate.getDate() - 1); // Subtract one day
                const match = observanceDate.toDateString() === cellDate.toDateString() &&
                       selectedObservances.includes(observance.Subcategory || 'General') &&
                       (observance.Category === 'Day' || observance.Category === 'Cultural');
                if (match) {
                    console.log("Matched observance:", observance);
                }
                return match;
            });

            console.log(`Cell ${dateString} observances:`, cellObservances.length);

            // Combine all items
            const cellItems = [...cellEvents, ...cellHolidays, ...cellObservances];

            // Clear existing items
            cell.querySelectorAll('.calendar-item').forEach(item => item.remove());

            cellItems.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'calendar-item';
                itemElement.innerHTML = `
                    <div class="item-title">${item.Subject}</div>
                    <div class="item-category">${item.Category}</div>
                `;
                itemElement.style.backgroundColor = getCategoryColor(item.Category);
                itemElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openEventModal(item);
                });
                cell.appendChild(itemElement);
            });

            console.log(`Added ${cellItems.length} items to cell ${dateString}`);
        }
    });

    // Display monthly observances
    displayMonthlyObservances();
}

// Modify the displayMonthlyObservances function
function displayMonthlyObservances() {
    const monthlyObservancesContainer = document.getElementById('monthly-observances');
    monthlyObservancesContainer.innerHTML = '<h3>Monthly Observances</h3>';

    const monthlyObservances = observances.filter(observance => {
        const observanceDate = new Date(observance['Start Date']);
        observanceDate.setDate(observanceDate.getDate() - 1); // Subtract one day
        return observance.Category === 'Month' &&
               observanceDate.getMonth() === currentMonth &&
               selectedObservances.includes(observance.Subcategory || 'General');
    });

    if (monthlyObservances.length > 0) {
        const observanceList = document.createElement('ul');
        monthlyObservances.forEach(observance => {
            const listItem = document.createElement('li');
            listItem.textContent = observance.Subject;
            observanceList.appendChild(listItem);
        });
        monthlyObservancesContainer.appendChild(observanceList);
    } else {
        monthlyObservancesContainer.innerHTML += '<p>No monthly observances for this month.</p>';
    }
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

    // Add event listener for closing modals
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

function updateCurrentMonthDisplay() {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    document.getElementById('current-month').textContent = `${monthNames[currentMonth]} ${currentYear}`;
}

// Add this at the end of your script
window.addEventListener('load', () => {
    console.log("Window loaded");
    logState();
});

// Wrap all DOM-dependent code in a DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('newsletter-search');
    const searchBtn = document.getElementById('search-btn');
    const searchResults = document.getElementById('search-results');
    const modal = document.getElementById('newsletter-modal');
    const modalTitle = document.getElementById('modal-title');
    const issueList = document.getElementById('issue-list');
    const closeBtn = document.getElementsByClassName('close')[0];

    // Sample data - replace with actual data in a real application
    const newsletters = {
        'link-in-bio': [
            { date: 'May 15, 2023', title: 'Top 5 Instagram Strategies for 2023' },
            { date: 'May 8, 2023', title: 'How to Leverage TikTok for Brand Growth' },
            { date: 'May 1, 2023', title: 'The Rise of Social Commerce: What You Need to Know' }
        ],
        'icymi': [
            { date: 'May 14, 2023', title: 'Twitter\'s Latest Updates: What You Missed' },
            { date: 'May 7, 2023', title: 'The Boom of AI-Generated Content on Social Platforms' },
            { date: 'April 30, 2023', title: 'Facebook\'s New Features for Content Creators' }
        ],
        'snaxshot': [
            { date: 'May 13, 2023', title: 'Plant-Based Innovations Taking Over Grocery Shelves' },
            { date: 'May 6, 2023', title: 'The Rise of Functional Beverages in 2023' },
            { date: 'April 29, 2023', title: 'Sustainable Packaging Trends in the Food Industry' }
        ]
    };

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        let results = [];

        for (let newsletter in newsletters) {
            results = results.concat(newsletters[newsletter].filter(issue => 
                issue.title.toLowerCase().includes(searchTerm)
            ).map(issue => ({...issue, newsletter})));
        }

        displaySearchResults(results);
    }

    function displaySearchResults(results) {
        searchResults.innerHTML = '';
        if (results.length === 0) {
            searchResults.innerHTML = '<p>No results found.</p>';
            return;
        }

        const ul = document.createElement('ul');
        results.forEach(result => {
            const li = document.createElement('li');
            li.textContent = `${result.newsletter}: ${result.title} (${result.date})`;
            ul.appendChild(li);
        });
        searchResults.appendChild(ul);
    }

    function showNewsletter(newsletter) {
        modalTitle.textContent = newsletter.charAt(0).toUpperCase() + newsletter.slice(1).replace('-', ' ');
        issueList.innerHTML = '';
        newsletters[newsletter].forEach(issue => {
            const issueItem = document.createElement('div');
            issueItem.className = 'issue-item';
            issueItem.innerHTML = `
                <h3>${issue.title}</h3>
                <p>${issue.date}</p>
            `;
            issueList.appendChild(issueItem);
        });
        modal.style.display = 'block';
    }

    // Event listeners
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    document.querySelectorAll('.view-issues-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const newsletter = e.target.closest('.newsletter-card').dataset.newsletter;
            showNewsletter(newsletter);
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Wrap the autocomplete setup in a function
    function initializeAutocomplete() {
        let autocompleteItems = [
            { title: "Instagram Growth Strategies", category: "Link In Bio" },
            { title: "TikTok for Brand Awareness", category: "Link In Bio" },
            { title: "Maximizing LinkedIn Engagement", category: "Link In Bio" },
            { title: "Twitter's New Features Explained", category: "ICYMI" },
            { title: "Facebook Algorithm Changes", category: "ICYMI" },
            { title: "Pinterest Marketing Tips", category: "ICYMI" },
            { title: "Plant-Based Food Trends", category: "Snaxshot" },
            { title: "Sustainable Packaging Innovations", category: "Snaxshot" },
            { title: "Functional Beverage Market Analysis", category: "Snaxshot" }
        ];

        function setupAutocomplete() {
            const searchInput = document.getElementById('newsletter-search');
            const searchContainer = document.querySelector('.search-container');
            
            if (!searchInput || !searchContainer) {
                console.error('Search input or container not found');
                return;
            }

            let currentFocus = -1;

            searchInput.addEventListener('input', function(e) {
                closeAllLists();
                if (!this.value) return false;
                
                const autocompleteList = document.createElement('div');
                autocompleteList.setAttribute('id', this.id + '-autocomplete-list');
                autocompleteList.setAttribute('class', 'autocomplete-items');
                searchContainer.appendChild(autocompleteList);

                const matchingItems = autocompleteItems.filter(item => 
                    item.title.toLowerCase().includes(this.value.toLowerCase()) ||
                    item.category.toLowerCase().includes(this.value.toLowerCase())
                );

                matchingItems.forEach(item => {
                    const itemElement = document.createElement('div');
                    itemElement.classList.add('autocomplete-item');
                    
                    const regex = new RegExp(this.value, 'gi');
                    const highlightedTitle = item.title.replace(regex, match => `<strong>${match}</strong>`);
                    
                    itemElement.innerHTML = `
                        ${highlightedTitle}
                        <br>
                        <span class="autocomplete-category">${item.category}</span>
                    `;
                    
                    itemElement.addEventListener('click', function(e) {
                        searchInput.value = item.title;
                        closeAllLists();
                    });
                    
                    autocompleteList.appendChild(itemElement);
                });
            });

            searchInput.addEventListener('keydown', function(e) {
                let x = document.getElementById(this.id + '-autocomplete-list');
                if (x) x = x.getElementsByTagName('div');
                if (e.keyCode == 40) {
                    currentFocus++;
                    addActive(x);
                } else if (e.keyCode == 38) {
                    currentFocus--;
                    addActive(x);
                } else if (e.keyCode == 13) {
                    e.preventDefault();
                    if (currentFocus > -1) {
                        if (x) x[currentFocus].click();
                    }
                }
            });

            function addActive(x) {
                if (!x) return false;
                removeActive(x);
                if (currentFocus >= x.length) currentFocus = 0;
                if (currentFocus < 0) currentFocus = (x.length - 1);
                x[currentFocus].classList.add('autocomplete-active');
            }

            function removeActive(x) {
                for (let i = 0; i < x.length; i++) {
                    x[i].classList.remove('autocomplete-active');
                }
            }

            function closeAllLists(elmnt) {
                const x = document.getElementsByClassName('autocomplete-items');
                for (let i = 0; i < x.length; i++) {
                    if (elmnt != x[i] && elmnt != searchInput) {
                        x[i].parentNode.removeChild(x[i]);
                    }
                }
            }

            document.addEventListener('click', function(e) {
                closeAllLists(e.target);
            });
        }

        setupAutocomplete();
    }

    // Initialize autocomplete
    initializeAutocomplete();
});

// Keep any existing code outside of the DOMContentLoaded event listener