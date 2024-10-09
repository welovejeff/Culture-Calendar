let currentDate = new Date();
let currentContent = {};
let events = [];
let categories = [];
let selectedCategories = [];

// Modify the loadCSVData function to include more logging
function loadCSVData() {
    return new Promise((resolve, reject) => {
        Papa.parse('events.csv', {
            header: true,
            download: true,
            complete: function(results) {
                events = results.data;
                // Extract unique categories
                categories = [...new Set(events.map(event => event.Category))];
                console.log('Extracted categories:', categories); // Add this line
                populateCategoryFilter();
                console.log('CSV data loaded:', events);
                resolve();
            },
            error: function(error) {
                console.error('Error loading CSV data:', error);
                alert('Failed to load CSV data. Please check the console for more information.');
                reject(error);
            }
        });
    });
}

// Modify the populateCategoryFilter function
function populateCategoryFilter() {
    const categorySelect = document.getElementById('category-select');
    console.log('Populating category filter');
    categorySelect.innerHTML = '';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        option.selected = true; // All categories selected by default
        categorySelect.appendChild(option);
    });
    selectedCategories = [...categories]; // All categories selected by default
    
    console.log('Category filter populated with options:', categorySelect.options.length);
    
    categorySelect.addEventListener('change', function() {
        selectedCategories = Array.from(this.selectedOptions).map(option => option.value);
        console.log('Selected categories:', selectedCategories);
        renderCalendar();
    });
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    document.getElementById('current-month').textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
    createCalendar(year, month);
    updateDatePicker();
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
    
    // Get the first 10 words of the content (or fewer if there aren't 10)
    const contentPreview = content.content ? content.content.split(' ').slice(0, 10).join(' ') : 'New content';
    const truncatedContent = contentPreview.length > 50 ? contentPreview.substring(0, 50) + '...' : contentPreview;
    
    placeholder.innerHTML = `
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

function removePlaceholder(placeholder, content) {
    const dayElement = placeholder.closest('.day');
    const dateKey = getDateKeyFromDay(dayElement);
    currentContent[dateKey] = currentContent[dateKey].filter(c => c !== content);
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

// Modify the openModal function to handle creating new content
function openModal(content = null, dayElement = null) {
    const modal = document.getElementById('modal');
    const form = document.getElementById('content-form');
    const platformSelect = document.getElementById('platform');
    const contentTextarea = document.getElementById('content');
    const descriptionTextarea = document.getElementById('description');
    const postTimeInput = document.getElementById('postTime');
    const approvalStatusSelect = document.getElementById('approvalStatus');
    const deleteButton = document.getElementById('delete-content');

    if (content) {
        platformSelect.value = content.platform === 'auto-populated' ? '' : content.platform;
        contentTextarea.value = content.content;
        descriptionTextarea.value = content.description || '';
        postTimeInput.value = content.postTime || '';
        approvalStatusSelect.value = content.approvalStatus || 'Draft';
        deleteButton.style.display = 'block';
    } else {
        form.reset();
        deleteButton.style.display = 'none';
    }

    modal.style.display = 'block';

    form.onsubmit = (e) => {
        e.preventDefault();
        const newContent = {
            platform: platformSelect.value,
            content: contentTextarea.value,
            description: descriptionTextarea.value,
            postTime: postTimeInput.value,
            approvalStatus: approvalStatusSelect.value
        };

        if (content) {
            // Update existing content
            Object.assign(content, newContent);
            const placeholder = document.querySelector(`.content-placeholder[data-platform="${content.platform}"]`);
            if (placeholder) {
                const contentPreview = newContent.content ? newContent.content.split(' ').slice(0, 3).join(' ') : 'New content';
                const truncatedContent = contentPreview.length > 20 ? contentPreview.substring(0, 20) + '...' : contentPreview;
                
                placeholder.dataset.platform = newContent.platform;
                placeholder.dataset.content = newContent.content;
                placeholder.dataset.description = newContent.description;
                placeholder.dataset.postTime = newContent.postTime;
                placeholder.dataset.approvalStatus = newContent.approvalStatus;
                placeholder.innerHTML = `
                    <span class="content-preview">${truncatedContent}</span>
                    <button class="remove-placeholder">&times;</button>
                `;
                
                // Update the class for styling
                placeholder.className = `content-placeholder ${newContent.platform}`;
            }
        } else if (dayElement) {
            // Add new content
            const dateKey = getDateKeyFromDay(dayElement);
            if (!currentContent[dateKey]) {
                currentContent[dateKey] = [];
            }
            currentContent[dateKey].push(newContent);
            const placeholder = createPlaceholder(newContent);
            dayElement.appendChild(placeholder);
        }

        updateContentData();
        renderCalendar();
        modal.style.display = 'none';
    };

    deleteButton.onclick = () => {
        if (content) {
            const placeholder = document.querySelector(`.content-placeholder.${content.platform}`);
            if (placeholder) {
                removePlaceholder(placeholder, content);
            }
        }
        modal.style.display = 'none';
        renderCalendar();
    };
}

function getDateKeyFromDay(day) {
    const dayNumber = day.querySelector('.day-number').textContent;
    return `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${dayNumber}`;
}

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
    currentContent = {};
    renderCalendar();
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
    console.log("Auto-populate started");
    const postsPerWeek = parseInt(document.getElementById('posts-per-week').value);
    const totalPosts = parseInt(document.getElementById('total-posts').value);
    const allowWeekends = document.getElementById('allow-weekends').checked;
    const distribution = document.getElementById('distribution').value;

    console.log(`Settings: ${postsPerWeek} posts per week, ${totalPosts} total posts, weekends ${allowWeekends ? 'allowed' : 'not allowed'}, ${distribution} distribution`);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    console.log(`Current month: ${month + 1}/${year}, ${daysInMonth} days`);

    let availableDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        if (allowWeekends || (date.getDay() !== 0 && date.getDay() !== 6)) {
            availableDays.push(day);
        }
    }

    console.log(`Available days: ${availableDays.join(', ')}`);

    let postDays;
    if (distribution === 'even') {
        postDays = distributeEvenly(availableDays, totalPosts);
    } else if (distribution === 'front-loaded') {
        postDays = distributeFrontLoaded(availableDays, totalPosts);
    } else {
        postDays = distributeBackLoaded(availableDays, totalPosts);
    }

    console.log(`Selected post days: ${postDays.join(', ')}`);

    // Clear existing content for the current month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (currentContent[dateKey]) {
            delete currentContent[dateKey];
        }
    }

    // Add new placeholders
    postDays.forEach(day => {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (!currentContent[dateKey]) {
            currentContent[dateKey] = [];
        }
        const newContent = {
            platform: getRandomPlatform(),
            content: 'New auto-generated content',
            description: '',
            postTime: '',
            approvalStatus: 'Draft'
        };
        currentContent[dateKey].push(newContent);
        console.log(`Added placeholder for ${dateKey}: ${JSON.stringify(newContent)}`);
    });

    console.log("Final currentContent:", currentContent);

    updateContentData();
    createCalendar(year, month);
    console.log("Auto-populate completed");
}

function distributeEvenly(availableDays, totalPosts) {
    const interval = Math.floor(availableDays.length / totalPosts);
    return availableDays.filter((_, index) => index % interval === 0).slice(0, totalPosts);
}

function distributeFrontLoaded(availableDays, totalPosts) {
    return availableDays.slice(0, totalPosts);
}

function distributeBackLoaded(availableDays, totalPosts) {
    return availableDays.slice(-totalPosts);
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
window.onload = function() {
    loadFromLocalStorage();
    
    loadCSVData().then(() => {
        console.log('CSV data loaded, rendering calendar');
        renderCalendar();
        setupAutoPopulateToggle(); // Add this line
    }).catch(error => {
        console.error('Failed to load CSV data:', error);
        alert('Failed to load CSV data. The calendar will render without events.');
        renderCalendar();
    });
    
    // ... (keep existing event listeners) ...
};

// Make sure the autoPopulateCalendar function is defined
function autoPopulateCalendar() {
    // ... (keep existing auto-populate logic) ...
}

// Add this event listener for the auto-populate button
document.getElementById('auto-populate-button').addEventListener('click', autoPopulateCalendar);

function createCalendar(year, month) {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    for (let i = 0; i < 42; i++) {
        const cell = document.createElement('div');
        cell.classList.add('calendar-cell');

        const dateDiv = document.createElement('div');
        dateDiv.classList.add('calendar-date');

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('calendar-content');

        const eventsDiv = document.createElement('div');
        eventsDiv.classList.add('calendar-events');

        cell.appendChild(dateDiv);
        cell.appendChild(contentDiv);
        cell.appendChild(eventsDiv);

        if (i >= startingDay && i < startingDay + daysInMonth) {
            const day = i - startingDay + 1;
            dateDiv.textContent = day;
            
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split('T')[0];
            
            // Add content posts
            if (currentContent[dateString]) {
                currentContent[dateString].forEach(content => {
                    const placeholder = createPlaceholder(content);
                    contentDiv.appendChild(placeholder);
                });
            }

            // Add CSV events
            if (events.length > 0) {
                const dayEvents = events.filter(event => {
                    const eventDate = new Date(event['Start Date']);
                    return eventDate.toDateString() === date.toDateString() &&
                           selectedCategories.includes(event.Category);
                });

                dayEvents.forEach(event => {
                    const eventElement = document.createElement('div');
                    eventElement.className = 'calendar-event';
                    eventElement.textContent = event.Subject;
                    eventElement.style.backgroundColor = getCategoryColor(event.Category);
                    eventElement.style.color = 'white';
                    eventElement.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openEventModal(event);
                    });
                    eventsDiv.appendChild(eventElement);
                });
            }

            // Add click event to add content
            cell.addEventListener('click', (e) => {
                if (e.target === cell || e.target === dateDiv || e.target === contentDiv) {
                    openModal(null, cell);
                }
            });
        }

        calendar.appendChild(cell);
    }

    setupDragAndDrop();
}

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
    // You can define your own color scheme for categories
    const colors = {
        'Holiday': '#ff9999',
        'Event': '#99ff99',
        'Promotion': '#9999ff'
    };
    return colors[category] || '#cccccc';
}

// Make sure to call createCalendar() when updating the calendar