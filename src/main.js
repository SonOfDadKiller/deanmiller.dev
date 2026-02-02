import { GenerateCubefield } from "./cubefield.js";

// Down arrow opacity control
let downArrow = document.getElementById("down-arrow");
let targetOpacity = 0;
var scrollAmount;

function UpdateArrow() {
	scrollAmount = document.documentElement.scrollTop || document.body.scrollTop;
	var opacity = (700 - scrollAmount) / 500;
	downArrow.style.opacity = opacity;
}

addEventListener('scroll', (event) => {
	UpdateArrow();
});

// Initialize cubefield
GenerateCubefield(35);
UpdateArrow();

// Initialize GLightbox for photo galleries
const lightbox = GLightbox({
	touchNavigation: true,
	loop: true,
	autoplayVideos: true
});

// Multi-select category filtering
const filterButtons = document.querySelectorAll('.filter-button');
const projectItems = document.querySelectorAll('.project-item');
let activeFilters = new Set(['all']);

// Masonry layout with horizontal ordering
const COL_COUNT = 3;
const GAP = 20;

function layoutMasonry() {
	const container = document.querySelector('.projects-container');
	const isMobile = window.innerWidth <= 1200;

	const visible = Array.from(projectItems).filter(item => !item.classList.contains('hidden'));
	visible.sort((a, b) => {
		const orderA = parseInt(a.dataset.sortOrder) || 999;
		const orderB = parseInt(b.dataset.sortOrder) || 999;
		return orderA - orderB;
	});

	// Reorder DOM elements to match sort order
	visible.forEach(item => container.appendChild(item));

	let colCount = isMobile ? 1 : COL_COUNT;

	const containerWidth = container.offsetWidth;
	const colWidth = (containerWidth - (colCount - 1) * GAP) / colCount;
	const colHeights = new Array(colCount).fill(0);

	visible.forEach((item, i) => {
		const col = i % colCount;
		item.style.width = colWidth + 'px';
		item.style.left = col * (colWidth + GAP) + 'px';
		item.style.top = colHeights[col] + 'px';
		colHeights[col] += item.offsetHeight + GAP;
	});

	container.style.height = Math.max(...colHeights) + 'px';
	container.style.opacity = '1';
}

// Layout after all resources (images, iframes) have loaded
window.addEventListener('load', layoutMasonry);
window.addEventListener('resize', layoutMasonry);

filterButtons.forEach(button => {
	button.addEventListener('click', () => {
		const filter = button.dataset.filter;

		// Handle "All" button
		if (filter === 'all') {
			activeFilters.clear();
			activeFilters.add('all');
			filterButtons.forEach(btn => btn.classList.remove('active'));
			button.classList.add('active');
		} else {
			// Remove "All" if selecting specific categories
			if (activeFilters.has('all')) {
				activeFilters.delete('all');
				document.querySelector('[data-filter="all"]').classList.remove('active');
			}

			// Toggle category filter
			if (activeFilters.has(filter)) {
				activeFilters.delete(filter);
				button.classList.remove('active');
			} else {
				activeFilters.add(filter);
				button.classList.add('active');
			}

			// If no filters selected, default to "All"
			if (activeFilters.size === 0) {
				activeFilters.add('all');
				document.querySelector('[data-filter="all"]').classList.add('active');
			}
		}

		// Apply filters
		projectItems.forEach(item => {
			const categories = item.dataset.category.split(' ');
			const hasMatch = activeFilters.has('all') || categories.some(cat => activeFilters.has(cat));
			if (hasMatch) {
				item.classList.remove('hidden');
			} else {
				item.classList.add('hidden');
			}
		});

		// Re-layout after filtering to maintain order
		layoutMasonry();
	});
});
