alias TYPO='echo typo, fixed.'
alias gs='git status'
alias gpuo='git push -u origin'
alias gcm='git commit -m'
alias gd='git diff'
alias gl='git log'

alias yarm='yarn'
alias ydev='yarn dev'
alias ya='yarn add'
alias profile='code  ~/.bash_profile'
alias edit='profile; reload' 
alias derp='echo derp; MESSAGETHING'

alias ga='git add'
# alias rename='git branch -m'

# reload profile
alias rlprofile='source C:/users/OWNER/.bash_profile'
alias rsprofile='rlprofile'
alias reload='source ~/.bash_profile'
alias rekiad='reload && TYPO'
alias yard='yarn'
# opens up notes file
# currently doesn't work properly because .notes should be referencing
# a git repo and that isn't set up yet
alias notes='vi C:/users/OWNER/.notes/index.md'


# follow this with (starting line),(ending line):file name to look at
# the complete git history for those lines
alias gll='git log -L'

alias sam='sam.cmd'

# Bernard aliases

# function ga() { git add $@; git status --short; }
# alias gaa='  git add --all; git status --short'
# alias gb='   git branch'
# function gc() { git commit -m "$*"; }
# alias gca='  git commit --amend -C head'
# function gcam() { git commit --amend -m "$*"; }
# alias gd='   git difftool --gui'
# alias gdn='  git diff --name-only'
# alias gm='   git mergetool --gui'
# alias gl='   git log --pretty=summary --use-mailmap'
# alias gla='  git log --pretty=all     --use-mailmap --source --all'
# alias gln='  git log --pretty=summary --name-status -n 10'
# alias glf='  git log --follow --oneline -- '
# alias go='   git checkout'
# alias gpop=' git stash pop'
# alias gpush='git stash push'
# alias gpls=' git stash list'
# alias gs='   git status --short; echo; git log --date=short --pretty=summary -n 3'
# alias gsls=' git status --porcelain | /usr/bin/cut -c4-'
# alias gh='   git show'
# alias ghn='  git show --name-status'
# alias gri='  git rebase --interactive'
# alias gra='  git rebase --abort'
# alias grc='  git rebase --continue'
# function gcp() { git cherry-pick --no-commit $@; git status --short; }
# alias gop='  git push -u origin'
# alias gou='  git pull --ff-only --prune'
# alias gof='  git fetch --prune'

alias ga='   f() { git add $@; git --no-pager status --short; };f'
alias gaa='  git add --all; git --no-pager status --short'
alias gb='   git branch'
alias gc='   f() { git commit -m "$*"; };f'
alias gca='  git commit --amend -C HEAD'
alias gcam=' f() { git commit --amend -m "$*"; };f'
alias gcp='  f() { git cherry-pick --no-commit $@; git --no-pager status --short; };f'
alias gd='   git difftool --gui'
alias gdn='  git --no-pager diff --name-only'
alias gm='   git mergetool --gui'
alias gl='   git log --pretty=summary --use-mailmap'
alias gla='  git log --pretty=all     --use-mailmap --source --all'
alias gln='  git log --pretty=summary --name-status -n 5'
alias glf='  git --no-pager log --follow --oneline -- '
alias go='   git checkout'
alias gpop=' git stash pop'
alias gpush='git stash push'
alias gpls=' git --no-pager stash list'
alias gs='   git status --short; echo; git --no-pager log --pretty=summary -n 3'
alias gsls=' git status --porcelain | /usr/bin/cut -c4-'
alias gh='   git show'
alias ghn='  git --no-pager show --name-status'
alias gri='  git rebase --interactive'
alias gra='  git rebase --abort'
alias grc='  git rebase --continue'
alias gr-d=' git fetch --prune && git rebase origin/dev'
alias gop='  git push origin -u'
alias gol='  git pull --ff-only'
alias gof='  f() { git fetch --prune $@; git gc --auto; };f'
alias clean='f() { find . -type d \( -name .git -o -name node_modules -o -name .next \) -prune -o -type f -name "*.orig" -print | xargs -I % rm %; git gc --aggressive; };f'

# --- editor
alias c='code -g'

alias ..='cd ..'
alias ...='.. && ..'
alias ....='... && ..'
alias .....='.... && ..'

echo "Loading ~\.bash_profile"
echo "ls | clip #pipe results to clipboard"

function boop { echo $@; echo boop;}

# --- editor
which pico  >/dev/null 2>&1 && export EDITOR='pico'
which nano  >/dev/null 2>&1 && export EDITOR='nano'
which code  >/dev/null 2>&1 && export EDITOR='code -g --wait' && alias c='code -g'
# which dircolors  >/dev/null 2>&1 && dircolors --bourne-shell
