document.addEventListener('DOMContentLoaded', () => {
    const trendsContainer = document.getElementById('trends-container');
    const loadingIndicator = document.getElementById('loading');
    const corsProxy = 'https://cors-anywhere.herokuapp.com/';
    const trendsUrl = 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US';

    // Add this line at the top of the file
    const INFEGY_SECRET = window.INFEGY_SECRET || null;

    function fetchTrends() {
        fetch(corsProxy + trendsUrl)
            .then(response => {
                if (response.status === 403) {
                    throw new Error('CORS Anywhere access denied. Please enable temporary access.');
                }
                return response.text();
            })
            .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
            .then(data => {
                const items = data.querySelectorAll('item');
                if (items.length === 0) {
                    throw new Error('No trend items found in the RSS feed.');
                }
                items.forEach(item => {
                    try {
                        const title = item.querySelector('title')?.textContent || 'No Title';
                        const pubDate = item.querySelector('pubDate')?.textContent 
                            ? new Date(item.querySelector('pubDate').textContent).toLocaleString()
                            : 'Unknown Date';
                        
                        // Correctly access the ht:picture element
                        const imageUrl = item.querySelector('ht\\:picture')?.textContent || '';

                        const newsItems = item.querySelectorAll('ht\\:news_item');
                        let newsItemsHtml = '';

                        newsItems.forEach(newsItem => {
                            const newsItemTitle = newsItem.querySelector('ht\\:news_item_title')?.textContent || 'No Title';
                            const newsItemSource = newsItem.querySelector('ht\\:news_item_source')?.textContent || 'Unknown Source';
                            const newsItemLink = newsItem.querySelector('ht\\:news_item_url')?.textContent || '#';
                            const newsItemPicture = newsItem.querySelector('ht\\:picture')?.textContent || '';

                            newsItemsHtml += `
                                <div class="news-item">
                                    ${newsItemPicture ? `<img src="${newsItemPicture}" alt="${newsItemTitle}" class="news-image" onerror="this.style.display='none'">` : ''}
                                    <h3>${newsItemTitle}</h3>
                                    <p>${newsItemSource}</p>
                                    <a href="${newsItemLink}" target="_blank">Read article</a>
                                </div>
                            `;
                        });

                        const googleTrendsLink = `https://trends.google.com/trends/explore?q=${encodeURIComponent(title)}&date=now%201-d&geo=US&hl=en-US`;

                        const trendItem = document.createElement('div');
                        trendItem.className = 'trend-item';
                        trendItem.innerHTML = `
                            <div class="trend-content">
                                <h2>${title}</h2>
                                ${imageUrl ? `<img src="${imageUrl}" alt="${title}" class="trend-image">` : ''}
                                <p>Published: ${pubDate}</p>
                                <a href="${googleTrendsLink}" target="_blank" class="google-trends-link">Google Trends</a>
                                <button class="read-more" data-title="${title}">Wikipedia</button>
                            </div>
                            <div class="news-items">
                                ${newsItemsHtml}
                            </div>
                        `;
                        trendsContainer.appendChild(trendItem);

                        // Add event listener for the "Read more" button
                        trendItem.querySelector('.read-more').addEventListener('click', (e) => {
                            const trendTitle = e.target.getAttribute('data-title');
                            showTrendDetails(trendTitle);
                        });
                    } catch (error) {
                        console.error('Error processing trend item:', error);
                    }
                });
                loadingIndicator.style.display = 'none';
                trendsContainer.style.display = 'grid';
            })
            .catch(error => {
                console.error('Error fetching trends:', error);
                loadingIndicator.style.display = 'none';
                if (error.message.includes('CORS Anywhere access denied')) {
                    trendsContainer.innerHTML = `
                        <p>Error: CORS Anywhere access denied.</p>
                        <p>Please <a href="https://cors-anywhere.herokuapp.com/corsdemo" target="_blank">click here</a> to request temporary access to the demo server.</p>
                        <button id="retry-button">Retry</button>
                    `;
                    document.getElementById('retry-button').addEventListener('click', fetchTrends);
                } else {
                    trendsContainer.innerHTML = `<p>Error loading trends: ${error.message}</p>`;
                }
                trendsContainer.style.display = 'block';
            });
    }

    // Add this new function to fetch and display trend details
    function showTrendDetails(trendTitle) {
        const modal = document.getElementById('trend-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');

        modalTitle.textContent = trendTitle;
        modalContent.innerHTML = '<p>Loading details...</p>';
        modal.style.display = 'block';

        // Fetch additional information about the trend
        fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(trendTitle)}`)
            .then(response => response.json())
            .then(data => {
                modalContent.innerHTML = `
                    <p>${data.extract}</p>
                    <a href="${data.content_urls.desktop.page}" target="_blank">Wikipedia</a>
                `;
            })
            .catch(error => {
                console.error('Error fetching trend details:', error);
                modalContent.innerHTML = '<p>Error loading trend details. Please try again later.</p>';
            });
    }

    // Add event listener to close the modal
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('trend-modal').style.display = 'none';
    });

    // Close the modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === document.getElementById('trend-modal')) {
            document.getElementById('trend-modal').style.display = 'none';
        }
    });

    // Social Listening code
    const socialListeningForm = document.getElementById('social-listening-form');
    const keywordInput = document.getElementById('keyword');
    const searchButton = document.getElementById('search-button');
    const resultsContainer = document.getElementById('social-listening-results');

    socialListeningForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const keyword = keywordInput.value.trim();
        if (!keyword) return;

        searchButton.disabled = true;
        searchButton.textContent = 'Searching...';
        resultsContainer.innerHTML = '<p>Loading results...</p>';

        try {
            if (!INFEGY_SECRET) {
                throw new Error('INFEGY_SECRET is not defined. Unable to make API request.');
            }

            const corsProxy = 'https://cors-anywhere.herokuapp.com/';
            const apiUrl = 'https://starscape.infegy.com/api/query/records';
            const response = await fetch(corsProxy + apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${INFEGY_SECRET}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    dataset_id: 'ds_gj4u3F40SLa',
                    query: {
                        op: 'contains',
                        fields: ['title', 'body'],
                        value: keyword
                    },
                    records: {
                        size: 5
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }

            const data = await response.json();
            displaySocialListeningResults(data.records);
        } catch (error) {
            console.error('Error fetching social listening data:', error);
            resultsContainer.innerHTML = `<p>An error occurred while fetching data: ${error.message}</p>`;
        } finally {
            searchButton.disabled = false;
            searchButton.textContent = 'Search';
        }
    });

    function displaySocialListeningResults(posts) {
        if (posts.length === 0) {
            resultsContainer.innerHTML = '<p>No results found.</p>';
            return;
        }

        const resultsHtml = posts.map(post => `
            <div class="social-post">
                <h3>${post.title}</h3>
                <p>${post.body}</p>
            </div>
        `).join('');

        resultsContainer.innerHTML = resultsHtml;
    }

    // Call the existing fetchTrends function to load Google Trends
    fetchTrends();
});
