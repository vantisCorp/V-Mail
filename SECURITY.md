# Polityka Bezpieczeństwa Vantis Mail

## 📋 Wstęp

Vantis Mail to bezpieczny system pocztowy zbudowany z myślą o zgodności z normami wojskowymi i wywiadowczymi. Ten dokument opisuje politykę bezpieczeństwa i procedury raportowania luk.

## 🔐 Model Bezpieczeństwa

### Architektura Zero Trust

Vantis Mail implementuje model Zero Trust:
- **Zero-Knowledge**: Serwer nie ma dostępu do haseł ani treści wiadomości
- **End-to-End Encryption**: Wszystkie dane są szyfrowane na kliencie
- **Perfect Forward Secrecy**: Każda sesja używa unikalnych kluczy
- **Defense in Depth**: Warstwy zabezpieczeń na każdym poziomie

### Kryptografia

#### Algorytmy
- **Hybrydowa wymiana kluczy**: X25519 + Kyber-1024
- **Szyfrowanie symetryczne**: AES-256-GCM
- **Hashowanie**: SHA-512
- **Podpisy**: Ed25519

#### Odporność Kwantowa
- Kyber-1024 zapewnia ochronę przed atakami komputerów kwantowych
- W pełni zgodny z NSA CNSA 2.0

## 🛡️ Funkcje Bezpieczeństwa

### 1. Moduł Phantom (Aliasy)
- Isolacja tożsamości
- Reverse-aliasing
- Obsługa własnych domen z DNSSEC, DKIM, DMARC, SPF

### 2. Moduł Fortress (Ochrona Treści)
- Szyfrowanie treści + temat + odbiorcy
- Samoniszczenie wiadomości
- Sanityzacja HTML (tylko tekst)
- Sanityzacja załączników w piaskownicy

### 3. Funkcje Specjalne
- Steganografia
- Przycisk Paniki
- Offline Mode (SQLCipher)

## 🚨 Raportowanie Luk Bezpieczeństwa

### Jak Zgłosić?

**NIE** otwieraj publicznych issue na GitHub!

**Bezpieczne kanały:**
- Email: security@vantis.io
- PGP: [KLUCZ PGP]
- Signal: [NUMER]

### Co Zgłosić?

Zgłaszaj:
- Podatności krytyczne (CVSS 9.0+)
- Podatności wysokie (CVSS 7.0-8.9)
- Podatności średnie (CVSS 4.0-6.9)
- Problemy z implementacją kryptografii
- Luki w autentykacji/autoryzacji

**Nie zgłaszaj przez:**
- Publiczne issue na GitHub
- Social media
- Fora publiczne

### Format Zgłoszenia

```markdown
## Tytuł
Krótki, opisowy tytuł luki

## Opis
Szczegółowy opis luki

## Kroki Reprodukcji
1. Krok 1
2. Krok 2
3. Krok 3

## Oczekiwane Zachowanie
Co powinno się stać

## Aktualne Zachowanie
Co się dzieje

## Środowisko
- System operacyjny:
- Przeglądarka:
- Wersja Vantis Mail:

## Dodatkowe Informacje
Logi, zrzuty ekranu, dowody

## Proponowane Rozwiązanie (opcjonalnie)
Jak naprawić lukę
```

## ⏱️ SLA Odpowiedzi

| Krytyczność | Czas Odpowiedzi | Czas Naprawy |
|-------------|-----------------|--------------|
| Krytyczna (9.0+) | 4 godziny | 48 godzin |
| Wysoka (7.0-8.9) | 24 godziny | 7 dni |
| Średnia (4.0-6.9) | 48 godzin | 14 dni |
| Niska (