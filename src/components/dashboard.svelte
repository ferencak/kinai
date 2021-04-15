<script>
  import FrameBar from './includes/frame.svelte'
  import Dashboard from './pages/dashboard.svelte'
  import Crypto from './pages/crypto.svelte'
  import Attack from './pages/attack.svelte'
  import Selfrep from './pages/selfrep.svelte'
  import Shell from './pages/shell.svelte'
  import Manage from "./pages/manage.svelte"

  export let master

  let active = 'manage'

  $: setActive = (page) => {
    active = page
  }

</script>

<style>
.wrapper {
  width: -webkit-fill-available;
  height: 88vh;
  padding-top: 4em;
}

.menu {
  display: flex;
  margin: 0 auto;
  width: -webkit-fill-available;
}

.menu-bar {
  margin: 0 auto;
  text-align: center;
  width: fit-content;
  padding-left: 2em;
  padding-right: 2em;
  background: #63636305;
  border-radius: 1em;
  box-shadow: 0px 20px 67px -17px black;
  display: -webkit-inline-box;
  margin-right: 0;
}

.user-bar {
  margin: 0 auto;
  text-align: center;
  width: 4em;
  padding-left: 2em;
  padding-right: 2em;
  background: #ffffff00;
  border-radius: 1em;
  box-shadow: 0px 20px 67px -17px black;
  display: -webkit-inline-box;
  margin-left: -8em;
  position: relative;
  left: 10em;
  color: #ffffff36;
  cursor: pointer;
  transition: .25s
}

.user-bar:hover {
  color: white;
  background: #0000001f;
}

.user-bar p {
  color: inherit;
  display: block;
  width: -webkit-fill-available;
  position: relative;
  top: -.2em;
  left: 1em;
}

.user-bar .license-end {
  position: absolute;
  font-size: .6em;
  top: 3.2em;
  width: -webkit-fill-available;
  left: 0.4em;
  color: inherit;
}

.user-bar .icon {
  color: inherit;
  position: absolute;
  top: 1.3em;
  left: 1.4em;
}

span.menu-item-wrapper.active {
  background: linear-gradient(45deg, #6781ff, #b400ff);
  color: white;
  box-shadow: 0px 0px 28px -3px #e482fd75;
}

p.menu-item {
  font-size: .9em;
  display: -webkit-inline-box;
  position: relative;
  top: -1.4em;
  padding-right: 1em;
  color: inherit;
}

span.menu-item-wrapper {
  display: inline-block;
  background: linear-gradient(45deg, #0000001c, #fdfdfd00);
  padding: 0.6em;
  border-radius: .5em;
  height: 1em;
  margin-left: .2em;
  margin-right: .2em;
  cursor: pointer;
  margin-top: .6em;
  color: #ffffff33;
  transition: .25s;
  position: relative;
  top: .1em;
}

span.menu-item-wrapper.active:hover {
  background: linear-gradient(45deg, #6781ff, #b400ff);
}

span.menu-item-wrapper:hover {
  background: linear-gradient(45deg, #00000048, #00000048);
  color: white
}

span.menu-item-wrapper .item-icon {
  display: -webkit-inline-box;
  padding: 0.7em;
  font-size: .9em;
  height: 1em;
  color: inherit;
  position: relative;
  top: -.65em;
  background: #ffffff05;
  border-radius: 9px;
  left: -.69em;
  width: 1.58em!important;
}

.hidden {
  display: none!important;
}

.min {
  width: 1.45em!important;
}
</style>

<FrameBar />

<div class='wrapper'>
  <div class='menu'>
    <div class='menu-bar'>
      <span class='menu-item-wrapper' 
        on:click={ setActive('dashboard') } 
        class:active={ active == 'dashboard' ? true : false}
        class:min={ active != 'dashboard' ? true : false}>
    
        <i class='fas fa-chart-line item-icon'></i>
        <p class='menu-item' class:hidden={ active != 'dashboard' ? true : false}>Dashboard</p>
      </span>
      <span class='menu-item-wrapper' 
        on:click={ setActive('crypto') } 
        class:active={ active == 'crypto' ? true : false} 
        class:min={ active != 'crypto' ? true : false}>
    
        <i class='fab fa-bitcoin item-icon'></i>
        <p class='menu-item' class:hidden={ active != 'crypto' ? true : false}>Crypto</p>
      </span>
      <span class='menu-item-wrapper' 
        on:click={ setActive('attack') } 
        class:active={ active == 'attack' ? true : false}
        class:min={ active != 'attack' ? true : false}>
    
        <i class='fas fa-robot item-icon'></i>
        <p class='menu-item' class:hidden={ active != 'attack' ? true : false}>Attack</p>
      </span>
      <span class='menu-item-wrapper'
        on:click={ setActive('selfrep') }
        class:active={ active == 'selfrep' ? true : false}
        class:min={ active != 'selfrep' ? true : false}>
    
        <i class='far fa-clone item-icon'></i>
        <p class='menu-item' class:hidden={ active != 'selfrep' ? true : false}>Selfrep</p>
      </span>
      <span class='menu-item-wrapper' 
        on:click={ setActive('shell') } 
        class:active={ active == 'shell' ? true : false}
        class:min={ active != 'shell' ? true : false}>
    
        <i class='fas fa-terminal item-icon'></i>
        <p class='menu-item' class:hidden={ active != 'shell' ? true : false}>Shell</p>
      </span>
      <span class='menu-item-wrapper'
        on:click={ setActive('manage') }
        class:active={ active == 'manage' ? true : false}
        class:min={ active != 'manage' ? true : false}>
    
        <i class='far fa-plus-square item-icon'></i>
        <p class='menu-item' class:hidden={ active != 'manage' ? true : false}>Manage</p>
      </span>
    </div>
  
    <div class='user-bar'>
      <i class='far fa-user icon'></i>
      <p>Account</p>
      <span class='license-end'>Lifetime</span>
    </div>
  </div>

  {#if active == 'dashboard'}
    <Dashboard master={ master } />
  {:else if  active == 'crypto'}
    <Crypto master={ master } />
  {:else if  active == 'attack'}
    <Attack master={ master } />
  {:else if  active == 'selfrep'}
    <Selfrep master={ master } />
  {:else if  active == 'shell'}
    <Shell master={ master } />
  {:else if  active == 'manage'}
    <Manage master={ master } />
  {/if}

</div>