1. nvm installieren (empfohlen: über Homebrew)

brew install nvm

1.2 nvm-Verzeichnis anlegen

1.3 nvm in zsh aktivieren (in ~/.zshrc)

Öffne deine zshrc:

nano ~/.zshrc

Füge ans Ende ein:

export NVM_DIR="$HOME/.nvm"
[ -s "$(brew --prefix nvm)/nvm.sh" ] && \. "$(brew --prefix nvm)/nvm.sh"
[ -s "$(brew --prefix nvm)/etc/bash_completion.d/nvm" ] && \. "$(brew --prefix nvm)/etc/bash_completion.d/nvm"


1.4 Terminal neu laden

source ~/.zshrc


1.5 Check

nvm -v

2. Node 20 LTS installieren & als Default setzen

nvm install 20
nvm use 20
nvm alias default 20

Check:

node -v 
npm -v


3. Wichtig: Alte Cache/Berechtigungsprobleme fixen (dein ursprünglicher Error)

Das ist genau dein EACCES/EEXIST-Problem im npm Cache. Mach einmal sauber:

npm cache clean --force
sudo chown -R $(whoami) ~/.npm

4. Pro Projekt: .nvmrc anlegen (Best Practice)

4.1 In deinen Projekt-Ordner wechseln

cd "/Users/lukasburkhardt/Eigene Projekte/React Projects"

4.2 Projektordner anlegen und reinwechseln

mkdir weather-project
cd weather-project

4.3 .nvmrc erstellen (Node 20)

echo "20" > .nvmrc

4.4 Node-Version im Projekt aktivieren

nvm use


5.1 Vite Scaffold in den aktuellen Ordner erzeugen

npm create vite@latest . -- --template react-ts