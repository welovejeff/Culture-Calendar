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
    console.log('Populating category filter'); // Add this line
    categorySelect.innerHTML = '';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        option.selected = true; // All categories selected by default
        categorySelect.appendChild(option);
    });
    selectedCategories = [...categories]; // All categories selected by default
    
    console.log('Category filter populated with options:', categorySelect.options.length); // Add this line
    
    categorySelect.addEventListener('change', function() {
        selectedCategories = Array.from(this.selectedOptions).map(option => option.value);
        console.log('Selected categories:', selectedCategories); // Add this line
        renderCalendar();
    });
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    document.getElementById('current-month').textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    for (let i = 0; i < firstDay.getDay(); i++) {
        calendar.appendChild(createDayElement(''));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = createDayElement(day);
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        console.log(`Rendering day ${day}, dateKey: ${dateKey}`);

        if (currentContent[dateKey] && currentContent[dateKey].length > 0) {
            currentContent[dateKey].forEach(content => {
                const placeholder = createPlaceholder(content);
                dayElement.appendChild(placeholder);
            });
        }

        // Filter events for this day based on selected categories
        const dayEvents = events.filter(event => {
            const startDate = new Date(event['Start Date']);
            return startDate.toDateString() === new Date(year, month, day).toDateString() &&
                   selectedCategories.includes(event.Category);
        });

        console.log(`Events for ${dateKey}:`, dayEvents); // Add this line

        if (dayEvents.length > 0) {
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'events-container';
            dayEvents.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'event';
                eventElement.textContent = event.Subject;
                eventElement.addEventListener('click', () => openEventModal(event));
                eventsContainer.appendChild(eventElement);
            });
            dayElement.appendChild(eventsContainer);
        }

        calendar.appendChild(dayElement);
    }

    setupDragAndDrop();
    setupToolbarDragAndDrop();
    updateDatePicker();
}

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

function setupToolbarDragAndDrop() {
    const draggableItems = document.querySelectorAll('.draggable-item');
    const dropZones = document.querySelectorAll('.day');

    draggableItems.forEach(item => {
        item.addEventListener('dragstart', toolbarDragStart);
    });

    dropZones.forEach(dropZone => {
        dropZone.addEventListener('dragover', dragOver);
        dropZone.addEventListener('drop', toolbarDrop);
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

function openModal(content = null) {
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
            platform: platformSelect.value || 'auto-populated', // Use 'auto-populated' if no platform is selected
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
        } else {
            // Add new content
            const day = document.querySelector('.day:not(:empty)');
            const dateKey = getDateKeyFromDay(day);
            if (!currentContent[dateKey]) {
                currentContent[dateKey] = [];
            }
            currentContent[dateKey].push(newContent);
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

function toolbarDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.classList[1]); // Store only the platform name
}

function toolbarDrop(e) {
    e.preventDefault();
    const platform = getRandomPlatform();
    const dayElement = e.target.closest('.day');
    
    if (!dayElement) return; // Ensure we're dropping on a day element
    
    const dateKey = getDateKeyFromDay(dayElement);
    
    // Check if a placeholder for this platform already exists on this day
    const existingPlaceholder = dayElement.querySelector(`.content-placeholder.${platform}`);
    if (existingPlaceholder) {
        return; // If it exists, do nothing
    }
    
    const newContent = {
        platform: platform,
        content: '',
        description: '',
        postTime: '',
        approvalStatus: 'Draft'
    };
    
    const placeholder = createPlaceholder(newContent);
    dayElement.appendChild(placeholder);
    
    if (!currentContent[dateKey]) {
        currentContent[dateKey] = [];
    }
    currentContent[dateKey].push(newContent);
    
    updateContentData();
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
setupToolbarDragAndDrop();

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
        const dateKey = `${year}-${month + 1}-${day}`;
        if (currentContent[dateKey]) {
            delete currentContent[dateKey];
        }
    }

    // Add new placeholders
    postDays.forEach(day => {
        const dateKey = `${year}-${month + 1}-${day}`;
        if (!currentContent[dateKey]) {
            currentContent[dateKey] = [];
        }
        const newContent = {
            platform: 'auto-populated', // Use 'auto-populated' instead of a specific platform
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
    renderCalendar();
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

// Modify the window.onload function to ensure populateCategoryFilter is called
window.onload = function() {
    loadFromLocalStorage();
    setupToolbarDragAndDrop();
    
    // Load CSV data and render calendar after data is loaded
    loadCSVData().then(() => {
        console.log('CSV data loaded, rendering calendar');
        renderCalendar();
    }).catch(error => {
        console.error('Failed to load CSV data:', error);
        alert('Failed to load CSV data. The calendar will render without events.');
        renderCalendar(); // Render calendar even if CSV loading fails
    });
    
    // ... existing event listeners ...
};

// Add this at the end of your existing JavaScript file
document.getElementById('toggle-auto-populate').addEventListener('click', function() {
    const controls = document.getElementById('auto-populate-controls');
    if (controls.style.display === 'none') {
        controls.style.display = 'block';
        this.textContent = 'Hide';
    } else {
        controls.style.display = 'none';
        this.textContent = 'Show';
    }
});