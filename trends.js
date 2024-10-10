document.addEventListener('DOMContentLoaded', () => {
    const trendsContainer = document.getElementById('trends-container');
    const loadingIndicator = document.getElementById('loading');
    const corsProxy = 'https://cors-anywhere.herokuapp.com/';
    const trendsUrl = 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US';

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
                        const description = item.querySelector('description')?.textContent || 'No Description';
                        const link = item.querySelector('link')?.textContent || '#';
                        const pubDate = item.querySelector('pubDate')?.textContent 
                            ? new Date(item.querySelector('pubDate').textContent).toLocaleString()
                            : 'Unknown Date';
                        
                        // Extract image URL from news_item_url or ht:picture if available
                        let imageUrl = '';
                        const newsItemUrl = item.querySelector('ht\\:news_item_url')?.textContent;
                        const htPicture = item.querySelector('ht\\:picture')?.textContent;
                        
                        if (newsItemUrl) {
                            imageUrl = newsItemUrl.replace('/url?q=', '').split('&')[0];
                        } else if (htPicture) {
                            imageUrl = htPicture;
                        }

                        const trendItem = document.createElement('div');
                        trendItem.className = 'trend-item';
                        trendItem.innerHTML = `
                            ${imageUrl ? `<img src="${imageUrl}" alt="${title}" class="trend-image" onerror="this.style.display='none'">` : ''}
                            <div class="trend-content">
                                <h2>${title}</h2>
                                <p>${description}</p>
                                <p>Published: ${pubDate}</p>
                                <a href="${link}" target="_blank">Read more</a>
                            </div>
                        `;
                        trendsContainer.appendChild(trendItem);
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

    fetchTrends();
});