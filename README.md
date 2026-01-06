# 📅 Gestionnaire d'Emploi du Temps - Guide d'Installation

Application web complète pour gérer votre emploi du temps avec précision (minutage détaillé).

## 🚀 Prérequis

- **Serveur Web** : Apache ou Nginx
- **PHP** : Version 7.4 ou supérieure
- **MySQL** : Version 5.7 ou supérieure (ou MariaDB 10.2+)
- **Extensions PHP** : PDO, PDO_MySQL

## 📦 Installation

### Étape 1 : Préparation des fichiers

1. Téléchargez tous les fichiers du projet
2. Placez-les dans le dossier de votre serveur web :
   - **XAMPP** : `C:\xampp\htdocs\schedule-manager\`
   - **WAMP** : `C:\wamp64\www\schedule-manager\`
   - **MAMP** : `/Applications/MAMP/htdocs/schedule-manager/`
   - **Linux** : `/var/www/html/schedule-manager/`

### Étape 2 : Créer la base de données

1. Ouvrez **phpMyAdmin** dans votre navigateur :
   - XAMPP/WAMP : `http://localhost/phpmyadmin`

2. Cliquez sur **"Nouveau"** dans la barre latérale

3. Créez une base de données :
   - Nom : `schedule_manager`
   - Interclassement : `utf8mb4_unicode_ci`

4. Sélectionnez la base créée et allez dans l'onglet **SQL**

5. Copiez et exécutez le code suivant :

```sql
CREATE TABLE IF NOT EXISTS schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    activity VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Étape 3 : Configuration de la connexion

1. Ouvrez le fichier `config.php`

2. Modifiez les paramètres de connexion selon votre configuration :

```php
define('DB_HOST', 'localhost');      // Généralement localhost
define('DB_NAME', 'schedule_manager'); // Nom de votre base
define('DB_USER', 'root');            // Votre utilisateur MySQL
define('DB_PASS', '');                // Votre mot de passe MySQL
```

**Exemples de configuration courante :**

- **XAMPP/WAMP par défaut** :
  - User : `root`
  - Pass : `` (vide)

- **MAMP** :
  - User : `root`
  - Pass : `root`

- **Production** :
  - User : Votre utilisateur MySQL
  - Pass : Votre mot de passe sécurisé

### Étape 4 : Modifier l'URL de l'API

1. Ouvrez le fichier `index.html`

2. Trouvez cette ligne dans le JavaScript :

```javascript
this.apiUrl = 'api.php';
```

3. Modifiez selon votre configuration :

```javascript
// Si dans un sous-dossier
this.apiUrl = '/schedule-manager/api.php';

// Si sur un domaine
this.apiUrl = 'https://votre-domaine.com/api.php';

// En local avec XAMPP/WAMP
this.apiUrl = 'http://localhost/schedule-manager/api.php';
```

### Étape 5 : Démarrer le serveur

1. **XAMPP** :
   - Démarrez Apache et MySQL depuis le panneau de contrôle

2. **WAMP** :
   - Démarrez tous les services (icône verte)

3. **MAMP** :
   - Cliquez sur "Start Servers"

### Étape 6 : Tester l'application

1. Ouvrez votre navigateur

2. Accédez à l'URL :
   ```
   http://localhost/schedule-manager/index.html
   ```

3. Testez l'application :
   - ✅ Ajoutez une activité
   - ✅ Vérifiez qu'elle apparaît
   - ✅ Testez la modification
   - ✅ Testez la suppression
   - ✅ Rechargez la page (les données doivent rester)

## 🗂️ Structure des fichiers

```
schedule-manager/
│
├── index.html          # Interface utilisateur
├── api.php             # API REST principale
├── config.php          # Configuration base de données
├── stats.php           # API statistiques (optionnel)
├── .htaccess          # Configuration Apache
└── README.md          # Ce fichier
```

## 🔧 Test de l'API

Vous pouvez tester l'API directement :

### Récupérer tous les horaires
```bash
# Dans le navigateur ou avec curl
GET http://localhost/schedule-manager/api.php
```

### Créer un horaire
```bash
POST http://localhost/schedule-manager/api.php
Content-Type: application/json

{
  "start_time": "08:00",
  "end_time": "09:00",
  "activity": "Petit déjeuner"
}
```

### Supprimer un horaire
```bash
DELETE http://localhost/schedule-manager/api.php
Content-Type: application/json

{
  "id": 1
}
```

## 🐛 Dépannage

### Erreur : "Erreur de connexion à la base de données"
- ✅ Vérifiez que MySQL est démarré
- ✅ Vérifiez les identifiants dans `config.php`
- ✅ Vérifiez que la base de données existe

### Erreur : "Page introuvable" (404)
- ✅ Vérifiez le chemin de `apiUrl` dans `index.html`
- ✅ Vérifiez que les fichiers PHP sont dans le bon dossier
- ✅ Vérifiez que le serveur Apache est démarré

### Erreur CORS
- ✅ Assurez-vous que les headers CORS sont présents dans `config.php`
- ✅ Testez l'API directement dans le navigateur
- ✅ Vérifiez les permissions du fichier `.htaccess`

### Les données ne se sauvent pas
- ✅ Ouvrez la console du navigateur (F12) pour voir les erreurs
- ✅ Vérifiez que l'URL de l'API est correcte
- ✅ Testez l'API avec un outil comme Postman

## 🔒 Sécurité (Production)

Pour un déploiement en production :

1. **Changez les identifiants MySQL**
2. **Activez HTTPS**
3. **Ajoutez une authentification utilisateur**
4. **Limitez les CORS** (dans `config.php`) :
   ```php
   header('Access-Control-Allow-Origin: https://votre-domaine.com');
   ```
5. **Protégez config.php** (via .htaccess - déjà inclus)

## 📱 Fonctionnalités

- ✅ Ajout d'activités avec horaires précis
- ✅ Modification des activités
- ✅ Suppression des activités
- ✅ Calcul automatique de la durée
- ✅ Statistiques (nombre de tâches, temps total)
- ✅ Tri automatique par ordre chronologique
- ✅ Design responsive (mobile + desktop)
- ✅ Sauvegarde en base de données MySQL
- ✅ Interface moderne et attractive

## 💡 Utilisation

1. **Ajouter une activité** : Remplissez le formulaire et cliquez sur "Enregistrer"
2. **Modifier** : Cliquez sur l'icône crayon (✏️)
3. **Supprimer** : Cliquez sur l'icône poubelle (🗑️)
4. **Visualiser** : Les statistiques se mettent à jour automatiquement

## 🆘 Support

En cas de problème :
1. Vérifiez les logs d'erreur PHP (dans le panneau de contrôle de XAMPP/WAMP)
2. Ouvrez la console du navigateur (F12) pour voir les erreurs JavaScript
3. Testez l'API directement pour isoler le problème

## 📄 Licence

Projet libre d'utilisation - Modifiez selon vos besoins !

---

**Bon planning ! 📅✨**