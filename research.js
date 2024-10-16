document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('researchForm');
    const brandInput = document.getElementById('brandInput');
    const results = document.getElementById('results');
    const brandName = document.getElementById('brandName');
    const companyResult = document.getElementById('companyResult');
    const categoryResult = document.getElementById('categoryResult');
    const consumerResult = document.getElementById('consumerResult');
    const competitionResult = document.getElementById('competitionResult');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const brand = brandInput.value.trim() || 'Generic Brand';
        
        // Dummy information regardless of what is typed in
        const dummyResults = {
            company: "Our company is a leading innovator in the industry, known for cutting-edge products and exceptional customer service. Founded in 1995, we have grown to become a global player with offices in 15 countries and over 5,000 employees worldwide.",
            category: "We operate in the technology sector, specifically focusing on consumer electronics and smart home devices. Our product range includes smartphones, tablets, smart speakers, and home automation systems. The market is rapidly evolving with increasing demand for interconnected and AI-powered devices.",
            consumer: "Our target consumers are tech-savvy individuals aged 25-45, with a middle to high income. They value innovation, design, and seamless integration of technology in their daily lives. Our customers are early adopters who appreciate quality and are willing to pay a premium for advanced features and reliability.",
            competition: "Our main competitors include major tech giants and innovative startups. We differentiate ourselves through our focus on user-friendly interfaces, robust ecosystem integration, and superior after-sales support. While facing stiff competition, we maintain a strong market position through continuous innovation and strategic partnerships."
        };

        displayResults(brand, dummyResults);
    });

    function displayResults(brand, data) {
        brandName.textContent = brand;
        companyResult.textContent = data.company;
        categoryResult.textContent = data.category;
        consumerResult.textContent = data.consumer;
        competitionResult.textContent = data.competition;
        results.classList.remove('hidden');
    }
});
