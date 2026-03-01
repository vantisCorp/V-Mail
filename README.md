# Vantis Mail - Profesjonalny System Pocztowy

## 📋 Opis

Vantis Mail to profesjonalny, bezpieczny system pocztowy zbudowany zgodnie z normami wojskowymi i wywiadowczymi (Zero Trust). Projekt łączy najlepsze funkcje Proton Mail, Tuta, StartMail i SimpleLogin w jednym interfejsie.

## 🔐 Architektura Bezpieczeństwa

### Model Kryptograficzny (NSA CNSA 2.0 & FIPS 140-3)

- **Hybrydowe Szyfrowanie**: Łączenie X25519 (ECC) z algorytmem Kyber-1024 (Post-Quantum)
- **FIPS 140-3 Level 4**: Klucze prywatne serwera przechowywane w certyfikowanych modułach HSM
- **Perfect Forward Secrecy (PFS)**: Unikalne klucze efemeryczne dla każdej sesji
- **Zero-Knowledge**: Serwer nie zna haseł użytkowników (protokół SRP/OPAQUE)

### Funkcje Bezpieczeństwa

1. **Moduł "Phantom" - Zarządzanie Aliasami**
   - Nieograniczone aliasy e-mail
   - Reverse-aliasing do odpowiadania
   - Obsługa własnych domen z DNSSEC, DKIM, DMARC i SPF

2. **Moduł "Fortress" - Bezpieczeństwo Treści**
   - Pełne szyfrowanie (treść + temat + odbiorcy)
   - Samoniszczenie wiadomości
   - Tryb "tylko tekst" (sanityzacja HTML)
   - Sanityzacja załączników w piaskownicy

3. **Funkcje Specjalne**
   - Steganografia (ukrywanie treści w zdjęciach)
   - Przycisk Paniki (natychmiastowe wylogowanie i czyszczenie danych)
   - Offline Mode (SQLCipher)

## 🏗️ Struktura Projektu

```
vantis-mail/
├── index.html          # Główny plik HTML
├── css/
│   └── style.css      # Style CSS z Dark Mode
├── js/
│   └── app.js         # Logika aplikacji JavaScript
├── assets/            # Zasoby (ikony, obrazy)
└── README.md          # Dokumentacja
```

## 🎨 Funkcje Interfejsu

### Panel Nawigacyjny
- **Odebrane**: Lista przychodzących wiadomości
- **Oznaczone**: Wiadomości oznaczone gwiazdką
- **Wysłane**: Historia wysłanych wiadomości
- **Robocze**: Wersje robocze
- **Aliasy Phantom**: Zarządzanie aliasami
- **Spam**: Wiadomości spam
- **Kosz**: Usunięte wiadomości

### Komponowanie Wiadomości
- Szyfrowanie end-to-end (X25519 + Kyber-1024)
- Samoniszczenie wiadomości
- Używanie aliasów Phantom
- Tryb tylko tekst
- Edytor zaawansowany
- Załączniki z sanityzacją
- Steganografia

### Wskaźniki Bezpieczeństwa
- Szyfrowanie End-to-End
- Ochrona Kwantowa
- Status szyfrowania dla każdej wiadomości
- Oznaczenia aliasów
- Oznaczenia samoniszczenia

## ⌨️ Skróty Klawiaturowe

- `C` - Nowa wiadomość
- `Escape` - Zamknij modale
- `Ctrl/Cmd + P` - Przycisk Paniki

## 🔧 Instalacja i Uruchomienie

### Wymagania
- Przeglądarka internetowa wspierająca HTML5, CSS3, ES6+
- Serwer HTTP do hostowania

### Uruchomienie

```bash
# Uruchomienie lokalne z Python
cd vantis-mail
python -m http.server 8000

# Lub użyj Node.js
npx http-server -p 8000

# Otwórz w przeglądarce
# http://localhost:8000
```

## 🛠️ Technologie

- **HTML5**: Semantyczna struktura
- **CSS3**: Nowoczesne style z Dark Mode
- **JavaScript ES6+**: Logika aplikacji
- **Font Awesome**: Ikony

## 📱 Responsywność

Aplikacja jest w pełni responsywna i działa na:
- Desktop (Windows, macOS, Linux)
- Tablet (iPad, Android)
- Mobile (iOS, Android)

## 🔮 Planowane Funkcje

### Krok 1: Backend Core
- API w Rust/Go
- Implementacja mechanizmu szyfrowania
- Testy wydajnościowe

### Krok 2: Klienci Desktop
- Rust + Tauri
- Integracja z kluczami sprzętowymi (YubiKey, Windows Hello, TouchID)

### Krok 3: Aplikacje Mobilne
- Swift/Kotlin
- Własny system powiadomień Push
- Ochrona przed zrzutami ekranu

### Krok 4: Audyt Bezpieczeństwa
- White-box penetration testing
- Weryfikacja zgodności z ISO 27001 i FIPS
- Audyt Cure53

## 📄 Licencja

Projekt jest częścią systemu VantisOS.

## 👥 Zespół

Vantis Development Team

## 📞 Kontakt

- Email: contact@vantis.io
- Web: https://vantis.io

---

**Vantis Mail** - Bezpieczeństwo to nie celem, to fundament.