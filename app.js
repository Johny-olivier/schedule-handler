/**
 * Schedule Manager - Premium Edition
 * Modern, accessible schedule management application
 */

class ScheduleManager {
    constructor() {
        this.apiUrl = 'https://schedule-handler.infinityfreeapp.com/api.php';
        this.schedules = {};
        this.currentView = 'week';
        this.currentDay = 'lundi';
        this.editingId = null;
        this.searchQuery = '';
        
        // Toast - Notifications
        this.initToastContainer();

        // Cache DOM elements
        this.cacheDOMElements();
        
        // Initialize app
        this.init();
    }

    initToastContainer() {
        // Vérifier si le container existe déjà
        let container = document.getElementById('toastContainer');
        
        // Si non, le créer
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'true');
            document.body.appendChild(container);
        }
    }

    cacheDOMElements() {
        // Views
        this.weekView = document.getElementById('weekView');
        this.dayView = document.getElementById('dayView');
        this.weekGrid = document.getElementById('weekGrid');
        this.daySelector = document.getElementById('daySelector');
        this.timeline = document.getElementById('timeline');
        
        // Controls
        this.btnWeek = document.getElementById('btnWeek');
        this.btnDay = document.getElementById('btnDay');
        this.searchInput = document.getElementById('searchInput');
        this.resetFilters = document.getElementById('resetFilters');
        
        // Modal
        this.modalOverlay = document.getElementById('modalOverlay');
        this.modalTitle = document.getElementById('modalTitle');
        this.form = document.getElementById('scheduleForm');
        this.openModalBtn = document.getElementById('openModalBtn');
        this.closeModalBtn = document.getElementById('closeModal');
        this.cancelBtn = document.getElementById('cancelBtn');
        
        // Form fields
        this.fields = {
            id: document.getElementById('scheduleId'),
            day: document.getElementById('dayOfWeek'),
            startTime: document.getElementById('startTime'),
            endTime: document.getElementById('endTime'),
            activity: document.getElementById('activity'),
            location: document.getElementById('location'),
            notes: document.getElementById('notes')
        };
    }

    init() {
        this.setupEventListeners();
        this.setupViewToggleIndicator();
        this.loadSchedules();
        this.addPageLoadAnimation();
    }

    setupEventListeners() {
        // View toggle
        this.btnWeek.addEventListener('click', () => this.switchView('week'));
        this.btnDay.addEventListener('click', () => this.switchView('day'));
        
        // Search
        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase().trim();
            this.render();
        });
        
        this.resetFilters.addEventListener('click', () => {
            this.searchInput.value = '';
            this.searchQuery = '';
            
            // Retirer les classes actives des stat cards
            document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active-filter'));
            
            this.render();
            this.showNotification('Filtre réinitialisé', 'info', 2000);
        });
        
        // Modal
        this.openModalBtn.addEventListener('click', () => this.openModal());
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        
        // Form
        this.form.addEventListener('submit', (e) => this.saveSchedule(e));
        
        // Modal overlay click
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.closeModal();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalOverlay.classList.contains('active')) {
                this.closeModal();
            }
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.searchInput.focus();
            }
        });

        // Category selection in modal
        document.querySelectorAll('.category-option').forEach(option => {
            option.addEventListener('click', () => {
                const radio = option.querySelector('input[type="radio"]');
                radio.checked = true;
            });
        });

        // Filtrage par catégorie via les stat cards
        this.setupStatCardFilters();

        // Export button
        const exportBtn = document.querySelector('.export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.showExportModal());
        }
    }

    showExportModal() {
        const options = [
            { icon: 'fas fa-file-pdf', label: 'PDF', action: 'pdf', color: '#ef4444' },
            { icon: 'fas fa-file-excel', label: 'Excel', action: 'excel', color: '#10b981' },
            { icon: 'fas fa-file-code', label: 'JSON', action: 'json', color: '#f59e0b' },
            { icon: 'fas fa-print', label: 'Imprimer', action: 'print', color: '#8b5cf6' }
        ];
        
        const optionsHtml = options.map(opt => `
            <button class="export-option" data-action="${opt.action}" style="--export-color: ${opt.color}">
                <i class="${opt.icon}"></i>
                <span>${opt.label}</span>
            </button>
        `).join('');
        
        const modal = document.createElement('div');
        modal.className = 'export-modal-overlay';
        modal.innerHTML = `
            <div class="export-modal">
                <div class="export-header">
                    <h3><i class="fas fa-download"></i> Exporter l'emploi du temps</h3>
                    <button class="export-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="export-options">
                    ${optionsHtml}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
        
        // Event listeners
        modal.querySelector('.export-close').addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
            }
        });
        
        modal.querySelectorAll('.export-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleExport(action);
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
            });
        });
    }

    handleExport(type) {
        switch(type) {
            case 'json':
                this.exportJSON();
                break;
            case 'excel':
                this.exportExcel();
                break;
            case 'pdf':
                this.exportPDF();
                break;
            case 'print':
                this.printSchedule();
                break;
        }
    }

    exportJSON() {
        const data = {
            export_date: new Date().toISOString(),
            schedules: this.schedules
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emploi-du-temps-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Export JSON réussi', 'success');
    }

    exportExcel() {
        // Créer un CSV (compatible Excel)
        let csv = 'Jour,Heure début,Heure fin,Activité,Catégorie,Lieu,Notes\n';
        
        Object.entries(this.schedules).forEach(([day, activities]) => {
            activities.forEach(activity => {
                csv += `"${day}","${activity.start_time}","${activity.end_time}","${activity.activity}","${activity.category || ''}","${activity.location || ''}","${activity.notes || ''}"\n`;
            });
        });
        
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emploi-du-temps-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Export Excel réussi', 'success');
    }

    exportPDF() {
        this.showNotification('Export PDF nécessite une bibliothèque tierce (jsPDF)', 'info', 4000);
        // Pour implémenter PDF, vous auriez besoin de jsPDF
        // Exemple : https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
    }

    printSchedule() {
        window.print();
        this.showNotification('Fenêtre d\'impression ouverte', 'info', 2000);
    }

    setupStatCardFilters() {
        const statCards = document.querySelectorAll('.stat-card');
        
        statCards.forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                
                if (category) {
                    // Mettre la catégorie dans la recherche
                    this.searchInput.value = category;
                    this.searchQuery = category.toLowerCase();
                    
                    // Ajouter une classe active pour le feedback visuel
                    statCards.forEach(c => c.classList.remove('active-filter'));
                    card.classList.add('active-filter');
                    
                    // Rendre la recherche
                    this.render();
                    
                    // Notification
                    this.showNotification(`Filtrage par catégorie : ${this.capitalize(category)}`, 'info', 2000);
                }
            });
        });
        
        // Double-clic pour réinitialiser le filtre
        statCards.forEach(card => {
            card.addEventListener('dblclick', () => {
                this.searchInput.value = '';
                this.searchQuery = '';
                statCards.forEach(c => c.classList.remove('active-filter'));
                this.render();
                this.showNotification('Filtre réinitialisé', 'info', 2000);
            });
        });
    }

    setupViewToggleIndicator() {
        const indicator = document.querySelector('.toggle-indicator');
        const updateIndicator = () => {
            const activeBtn = document.querySelector('.toggle-btn.active');
            if (activeBtn && indicator) {
                const rect = activeBtn.getBoundingClientRect();
                const parent = activeBtn.parentElement.getBoundingClientRect();
                indicator.style.width = `${rect.width}px`;
                indicator.style.transform = `translateX(${rect.left - parent.left}px)`;
            }
        };
        
        updateIndicator();
        window.addEventListener('resize', updateIndicator);
    }

    addPageLoadAnimation() {
        document.body.style.opacity = '0';
        requestAnimationFrame(() => {
            document.body.style.transition = 'opacity 0.5s ease';
            document.body.style.opacity = '1';
        });
    }

    async loadSchedules() {
        try {
            const response = await fetch(`${this.apiUrl}?week=true`);
            const data = await response.json();
            
            if (data.success) {
                this.schedules = this.normalizeScheduleData(data.data || {});
                this.updateStats();
                this.renderDaySelector();
                this.render();
            } else {
                this.showNotification('Erreur de chargement', 'error');
            }
        } catch (error) {
            console.error('Load error:', error);
            this.showNotification('Erreur de connexion', 'error');
        }
    }

    normalizeScheduleData(data) {
        const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
        const normalized = {};
        
        days.forEach(day => {
            normalized[day] = Array.isArray(data[day]) ? data[day] : [];
        });
        
        return normalized;
    }

    switchView(view) {
        this.currentView = view;
        
        // Update button states
        this.btnWeek.classList.toggle('active', view === 'week');
        this.btnDay.classList.toggle('active', view === 'day');
        this.btnWeek.setAttribute('aria-pressed', view === 'week');
        this.btnDay.setAttribute('aria-pressed', view === 'day');
        
        // Update view visibility
        this.weekView.classList.toggle('active', view === 'week');
        this.dayView.classList.toggle('active', view === 'day');
        
        // Update indicator
        this.setupViewToggleIndicator();
        
        this.render();
    }

    render() {
        if (this.currentView === 'week') {
            this.renderWeekView();
        } else {
            this.renderDayView();
        }
    }

    renderWeekView() {
        const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
        
        this.weekGrid.innerHTML = days.map(day => {
            const activities = this.getFilteredActivities(day);
            return this.createDayCard(day, activities);
        }).join('');
        
        this.attachSlotEventListeners();
    }

    renderDaySelector() {
        const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
        
        this.daySelector.innerHTML = days.map(day => `
            <button 
                class="day-btn" 
                data-day="${day}"
                aria-pressed="${day === this.currentDay}"
            >
                ${this.capitalize(day)}
            </button>
        `).join('');
        
        this.daySelector.querySelectorAll('.day-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentDay = btn.dataset.day;
                this.updateDaySelector();
                this.renderDayView();
            });
        });
    }

    updateDaySelector() {
        this.daySelector.querySelectorAll('.day-btn').forEach(btn => {
            const isActive = btn.dataset.day === this.currentDay;
            btn.setAttribute('aria-pressed', isActive);
        });
    }

    renderDayView() {
        const activities = this.getFilteredActivities(this.currentDay);
        
        if (activities.length === 0) {
            this.timeline.innerHTML = this.createEmptyState();
            return;
        }
        
        this.timeline.innerHTML = activities
            .map(activity => this.createTimelineItem(activity))
            .join('');
        
        this.attachTimelineEventListeners();
    }

    getFilteredActivities(day) {
        const activities = this.schedules[day] || [];
        
        if (!this.searchQuery) return activities;
        
        // Vérifier si c'est une catégorie exacte
        const categories = ['ecole', 'transport', 'personnel', 'repos'];
        if (categories.includes(this.searchQuery)) {
            // Filtrer uniquement par catégorie
            return activities.filter(a => a.category === this.searchQuery);
        }
        
        // Sinon, recherche textuelle normale
        return activities.filter(activity => 
            this.matchesSearch(activity, this.searchQuery)
        );
    }

    matchesSearch(activity, query) {
        const searchableFields = [
            activity.activity,
            activity.location,
            activity.notes,
            activity.category
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableFields.includes(query);
    }

    createDayCard(day, activities) {
        const slotsHtml = activities.length > 0
            ? activities.map(a => this.createSlot(a)).join('')
            : '<div class="empty-state"><p>Aucune activité</p></div>';
        
        return `
            <div class="day-card">
                <div class="day-header">
                    <div class="day-title">${this.capitalize(day)}</div>
                    <div class="day-count">${activities.length}</div>
                </div>
                <div class="day-body">${slotsHtml}</div>
            </div>
        `;
    }

    createSlot(activity) {
        const duration = this.calculateDuration(activity.start_time, activity.end_time);
        const category = activity.category || 'autre';
        
        return `
            <div 
                class="slot ${category}" 
                data-id="${activity.id}"
                tabindex="0"
                role="button"
            >
                <div class="slot-time">
                    <i class="material-icons" style="font-size: 16px;">schedule</i>
                    ${this.formatTime(activity.start_time)} — ${this.formatTime(activity.end_time)}
                    <span style="margin-left: auto; opacity: 0.7;">
                        ${this.formatDuration(duration)}
                    </span>
                </div>
                <div class="slot-activity">${this.escapeHtml(activity.activity)}</div>
                ${activity.location ? `
                    <div class="slot-meta">
                        <i class="fas fa-map-marker-alt"></i>
                        ${this.escapeHtml(activity.location)}
                    </div>
                ` : ''}
                ${activity.is_fixed ? '<div class="slot-meta">Horaire fixe</div>' : ''}
                <div class="slot-badge">${category}</div>
            </div>
        `;
    }

    createTimelineItem(activity) {
        const duration = this.calculateDuration(activity.start_time, activity.end_time);
        const category = activity.category || 'autre';
        const canEdit = !activity.is_fixed;
        
        return `
            <div class="timeline-item ${category}" data-id="${activity.id}">
                <div class="timeline-time">
                    <i class="material-icons" style="font-size: 18px;">schedule</i>
                    ${this.formatTime(activity.start_time)} — ${this.formatTime(activity.end_time)}
                    <span style="margin-left: 8px; opacity: 0.7;">
                        ${this.formatDuration(duration)}
                    </span>
                </div>
                <div class="timeline-activity">${this.escapeHtml(activity.activity)}</div>
                ${activity.location ? `
                    <div class="timeline-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${this.escapeHtml(activity.location)}
                    </div>
                ` : ''}
                ${activity.notes ? `
                    <div class="timeline-notes">
                        <i class="fas fa-sticky-note"></i>
                        ${this.escapeHtml(activity.notes)}
                    </div>
                ` : ''}
                ${activity.is_fixed ? '<div class="timeline-notes">Horaire fixe (non modifiable)</div>' : ''}
                ${canEdit ? `
                    <div class="timeline-actions">
                        <button class="icon-btn edit-btn" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="icon-btn delete-btn" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    createEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-calendar-plus"></i>
                <div class="empty-state-title">Aucune activité prévue</div>
                <div class="empty-state-text">
                    Cliquez sur le bouton + pour ajouter une activité
                </div>
            </div>
        `;
    }

    attachSlotEventListeners() {
        this.weekGrid.querySelectorAll('.slot[data-id]').forEach(slot => {
            const id = parseInt(slot.dataset.id);
            
            slot.addEventListener('click', () => this.viewActivity(id));
            slot.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.viewActivity(id);
                }
            });
        });
    }

    attachTimelineEventListeners() {
        this.timeline.querySelectorAll('.timeline-item').forEach(item => {
            const id = parseInt(item.dataset.id);
            
            const editBtn = item.querySelector('.edit-btn');
            const deleteBtn = item.querySelector('.delete-btn');
            
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.editActivity(id);
                });
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteActivity(id);
                });
            }
        });
    }

    viewActivity(id) {
        const activity = this.findActivityById(id);
        if (!activity) return;
        
        if (activity.is_fixed) {
            this.showNotification('Horaire fixe (non modifiable)', 'info');
            return;
        }
        
        this.editActivity(id);
    }

    editActivity(id) {
        const activity = this.findActivityById(id);
        if (!activity) return;
        
        if (activity.is_fixed) {
            this.showNotification('Les horaires fixes ne peuvent pas être modifiés', 'warning');
            return;
        }
        
        this.editingId = id;
        this.modalTitle.textContent = 'Modifier l\'activité';
        
        // Populate form
        this.fields.id.value = activity.id;
        this.fields.day.value = activity.day_of_week;
        this.fields.startTime.value = activity.start_time;
        this.fields.endTime.value = activity.end_time;
        this.fields.activity.value = activity.activity || '';
        this.fields.location.value = activity.location || '';
        this.fields.notes.value = activity.notes || '';
        
        // Set category
        const categoryRadio = document.querySelector(`input[name="category"][value="${activity.category || 'autre'}"]`);
        if (categoryRadio) categoryRadio.checked = true;
        
        this.openModal();
        setTimeout(() => this.fields.activity.focus(), 150);
    }

    async deleteActivity(id) {
        const activity = this.findActivityById(id);
        if (!activity) return;
        
        if (!confirm(`Voulez-vous vraiment supprimer "${activity.activity}" ?`)) return;
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Activité supprimée', 'success');
                await this.loadSchedules();
            } else {
                this.showNotification(data.message || 'Erreur de suppression', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showNotification('Erreur de connexion', 'error');
        }
    }

    openModal() {
        if (!this.editingId) {
            this.modalTitle.textContent = 'Ajouter une activité';
            this.form.reset();
            this.fields.id.value = '';
            
            // Set default category
            const defaultCategory = document.querySelector('input[name="category"][value="ecole"]');
            if (defaultCategory) defaultCategory.checked = true;
        }
        
        this.modalOverlay.classList.add('active');
        this.modalOverlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => this.fields.day.focus(), 150);
    }

    closeModal() {
        this.modalOverlay.classList.remove('active');
        this.modalOverlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        this.editingId = null;
    }

    async saveSchedule(e) {
        e.preventDefault();
        
        const selectedCategory = document.querySelector('input[name="category"]:checked');
        
        const data = {
            day_of_week: this.fields.day.value,
            start_time: this.fields.startTime.value,
            end_time: this.fields.endTime.value,
            activity: this.fields.activity.value.trim(),
            category: selectedCategory ? selectedCategory.value : 'autre',
            location: this.fields.location.value.trim(),
            notes: this.fields.notes.value.trim(),
            is_fixed: false
        };
        
        // Validation
        if (!data.day_of_week || !data.start_time || !data.end_time || !data.activity) {
            this.showNotification('Veuillez remplir tous les champs obligatoires', 'warning');
            return;
        }
        
        if (data.start_time >= data.end_time) {
            this.showNotification('L\'heure de fin doit être après l\'heure de début', 'warning');
            return;
        }
        
        try {
            const method = this.editingId ? 'PUT' : 'POST';
            if (this.editingId) data.id = this.editingId;
            
            const response = await fetch(this.apiUrl, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(
                    this.editingId ? 'Activité modifiée' : 'Activité ajoutée',
                    'success'
                );
                this.closeModal();
                await this.loadSchedules();
            } else {
                this.showNotification(result.message || 'Erreur d\'enregistrement', 'error');
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showNotification('Erreur de connexion', 'error');
        }
    }

    updateStats() {
        const stats = {
            ecole: 0,
            transport: 0,
            personnel: 0,
            repos: 0
        };
        
        const totalMinutes = Object.values(this.schedules)
            .flat()
            .reduce((acc, activity) => {
                const duration = this.calculateDuration(activity.start_time, activity.end_time);
                const category = activity.category;
                
                if (stats.hasOwnProperty(category)) {
                    stats[category] += duration;
                }
                
                return acc + duration;
            }, 0);
        
        // Update stat values
        Object.keys(stats).forEach(category => {
            const element = document.getElementById(`stat${this.capitalize(category)}Value`);
            if (element) {
                element.textContent = this.formatDuration(stats[category]);
            }
            
            // Update progress bar
            const progressBar = document.querySelector(`.stat-${category} .stat-progress-bar`);
            if (progressBar) {
                const percentage = totalMinutes > 0 ? (stats[category] / totalMinutes) * 100 : 0;
                progressBar.style.width = `${percentage}%`;
            }
        });
    }

    findActivityById(id) {
        return Object.values(this.schedules)
            .flat()
            .find(a => parseInt(a.id) === parseInt(id));
    }

    calculateDuration(start, end) {
        const [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);
        return (endHour * 60 + endMin) - (startHour * 60 + startMin);
    }

    formatDuration(minutes) {
        if (minutes <= 0) return '0min';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}min`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h${mins < 10 ? '0' : ''}${mins}`;
    }

    formatTime(time) {
        return time.substring(0, 5);
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        const titles = {
            success: 'Succès',
            error: 'Erreur',
            warning: 'Attention',
            info: 'Information'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.style.setProperty('--toast-duration', `${duration}ms`);
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icons[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Fermer">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(toast);

        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.removeToast(toast));
        
        // Auto remove
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);
    }

    removeToast(toast) {
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.scheduleApp = new ScheduleManager();
});
