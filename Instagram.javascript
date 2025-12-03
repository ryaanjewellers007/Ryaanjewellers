async function loadInstagramFeed() {
    const ACCESS_TOKEN = 'YOUR_INSTAGRAM_ACCESS_TOKEN';
    const USER_ID = 'YOUR_INSTAGRAM_USER_ID';
    
    try {
        const response = await fetch(
            `https://graph.instagram.com/${USER_ID}/media?fields=id,caption,media_url,permalink&access_token=${ACCESS_TOKEN}&limit=6`
        );
        const data = await response.json();
        
        const instagramGrid = document.getElementById('instagramGrid');
        instagramGrid.innerHTML = '';
        
        data.data.forEach(post => {
            const instaItem = document.createElement('div');
            instaItem.className = 'insta-item';
            instaItem.innerHTML = `
                <a href="${post.permalink}" target="_blank">
                    <img src="${post.media_url}" alt="${post.caption || 'Instagram post'}">
                    <div class="insta-overlay">
                        <i class="fab fa-instagram"></i>
                    </div>
                </a>
            `;
            instagramGrid.appendChild(instaItem);
        });
    } catch (error) {
        console.error('Error loading Instagram:', error);
        // Fallback to static images
    }
}
