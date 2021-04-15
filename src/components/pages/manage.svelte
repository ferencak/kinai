<script>
  import {range} from '../../utils/range.js'
  import Client from '../../services/client'
  export let master

  let active = 'ssh',
      activePage = 1,
      isModalOpened = false,
      altList = '',
      _Client = new Client(master)

  $: setActive = (list) => {
    active = list
  }

  $: nextPage = (page) => {
    Math.abs(_Client.getTotalPageCount(active) - 2)
    activePage = page
  }

  $: toggleModal = () => {
    document.getElementById('modal').style.display = isModalOpened ? 'none' : 'block'
    isModalOpened = !isModalOpened
  }

  $: isDone = () => {
    document.getElementById('done').style.display = altList.length > 0 ? 'block' : 'none'
  }

  const addToList = () => {
    _Client.addToList(altList)
    altList = ''
    toggleModal()
  }

  const checkList = () => {
    _Client.checkList(active)
  }

  let mySSHList = [],
      myTelnetList = []

  $: mySSHList = _Client.getListToPage(activePage, 'ssh')
  $: myTelnetList = _Client.getListToPage(activePage, 'telnet')
</script>

<style>
  .switcher {
    display: block;
    width: 48.5em;
    height: 3em;
    position: relative;
    top: 2em;
    margin: 0 auto;
    text-align: center;
  }

  .switcher .item {
    display: -webkit-inline-box;
    width: 9em;
    text-align: center;
    height: 2.5em;
    background: #ffffff03;
    color: #ffffff21;
    border-radius: 1em;
    box-shadow: 0px 0px 36px -14px black;
    margin-left: .5em;
    margin-right: .5em;
    transition: .25s;
    cursor: pointer;
  }

  .switcher .item:hover {
    background: #05050514;
  }

  .switcher .item.active {
    background: linear-gradient(45deg, #6781ff, #b400ff);
    color: white;
    box-shadow: 0px 0px 28px -3px #e482fd75;
  }

  .switcher .item p.title {
    display: block;
    width: fit-content;
    text-align: center;
    margin: 0 auto;
    line-height: 2.5em;
    color: inherit;
  }

  .list {
    display: block;
    height: 27em;
    width: 49.5em;
    position: relative;
    top: 4em;
    margin-left: 5em;
    margin-right: 5em;
    text-align: center;
    background: linear-gradient(45deg, #fdfdfd05, #00000029);
    border-radius: 1em;
    box-shadow: 0px 0px 36px -14px black;
    margin: 0 auto;
  }

  .list .head {
    display: block;
    width: -webkit-fill-available;
    height: 3em;
    background: linear-gradient(45deg, #0a080a47, #4c4c4c08);
    border-radius: 1em;
    box-shadow: 0px 5px 41px -10px black;
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
  }

  .list .head .left {
    width: 50%;
    text-align: left;
    display: inline-block;
    float: left;
  }

  .list .head .left p.title {
    line-height: 1em;
    margin-left: 1em;
    color: #ffffff1f;
  }

  .list .head .left p.title span {
    text-transform: uppercase;
    font-family: 'Nunito-Bold';
  }

  .list .head .right {
    width: 40%;
    text-align: right;
    display: inline-block;
    float: right;
    line-height: 3em;
    margin-right: 1em;
  }

  .list .head .right .icon {
    color: #ffffff1c;
    padding: .5em;
    background: #ffffff0a;
    float: right;
    display: -webkit-inline-box;
    margin-top: .5em;
    border-radius: 500px;
    transition: .25s;
    cursor: pointer;
  }

  .list .head .right .icon.add:hover {
    color: #ffffff;
    background: #2868f9;
    box-shadow: 0px 0px 19px 4px #1a76ff42;
  }

  .list .content {
    display: block;
    height: 24em;
  }

  .list .content .item {
    display: block;
    width: -webkit-fill-available;
    height: 3em;
    background: linear-gradient(45deg, #ffffff05, #ffffff08);
    margin-top: 1em;
    margin-left: 1em;
    margin-right: 1em;
    border-radius: 1em;
    text-align: left;
  }

  .list .content .item .label.icon {
    color: #57ff20;
    padding-top: .5em;
    padding-bottom: .5em;
    line-height: 4em;
    position: relative;
    top: .5em;
  }

  .list .content .item .label.icon.unconfirmed {
    color: #db2828!important;
  }

  .list .content .item .label {
    display: inline-block;
    margin-right: .3em;
    margin-left: .5em;
    background: #ffffff03;
    padding-left: 1em;
    padding-right: 1em;
    border-radius: 1em;
    color: #ffffff1a;
    margin-top: 0em;
  }

  .list .content .item .label.status {
    text-transform: capitalize;
  }

  .list .content .item .label span {
    padding-left: .5em;
    padding-right: .5em;
    background: #ffffff08;
    border-radius: 1em;
    position: relative;
    left: -1em;
    margin-right: -.7em;
  }

  .text-green {
    color: #2aff2a!important;
    text-shadow: 0px 0px 10px #10ff10!important;
  }

  .pager {
    display: block;
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
  }

  .pager p {
    display: inline-block;
    padding: .5em;
    background: #ffffff05;
    margin-right: .5em;
    border-radius: 1em;
    padding-left: 1em;
    padding-right: 1em;
    color: #ffffff38;
    box-shadow: 0px 0px 20px -8px black;
    cursor: pointer;
    transition: .25s;
  }

  .pager p:hover {
    background: linear-gradient(45deg, #fdfdfd05, #00000029);
    color: white;
  }

  .pager p.active {
    background: linear-gradient(45deg, #6781ff, #b400ff);
    box-shadow: 0px 0px 28px -3px #e482fd75;
    color: white;
  }

  .pager p.dotter {
    color: #ffffff33;
    background: unset;
    box-shadow: unset;
    position: relative;
    top: -.3em;
    cursor: unset;
  }

  .modal-wrapper {
    display: none;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: -webkit-fill-available;
    height: -webkit-fill-available;
    backdrop-filter: blur(5px);
  }

  .modal-wrapper .inner {
    width: 39.5em;
    height: 30em;
    background: #111019de;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    border-radius: 1em;
    box-shadow: 0px 6px 50px -5px black;
  }

  .modal-wrapper .inner .head .left {
    display: inline-block;
    width: 50%;
    float: left;
  }

  .modal-wrapper .inner .head .left p.title {
    margin-left: 1em;
    text-transform: uppercase;
    color: #ffffff2b;
  }

  .modal-wrapper .inner .head .right {
    display: inline-block;
    width: 50%;
    float: right;
  }

  .modal-wrapper .inner .head .right p {
    width: 2em;
    display: block;
    margin: 0;
    float: right;
    margin-top: 2em;
    margin-right: 1em;
    color: #ffffff2e;
    background: #ffffff0d;
    border-radius: 500px;
    height: 2em;
    line-height: 2.14em;
    text-align: center;
    transition: .25s;
    cursor: pointer;
    padding-right: .05em;
  }

  .modal-wrapper .inner .head .right p:hover {
    background: red;
    color: white;
  }
  
  .modal-wrapper .inner .content {
    display: block;
    width: -webkit-fill-available;
    background: #ffffff03;
    margin: 1em;
    margin-top: 5em;
    height: -webkit-fill-available;
    margin-bottom: 2em;
    border-radius: 1em;
  }

  .modal-wrapper .inner .content textarea {
    background: transparent;
    border: 0px;
    width: -webkit-fill-available;
    height: 25em;
    font-family: 'Nunito-Regular';
    margin: 1em;
    resize: none;
    color: white
  }

  .modal-wrapper .inner .content textarea:focus {
    outline: none
  }

  .done {
    display: none;
    position: absolute;
    left: 50%;
    top: 90%;
    transform: translate(-50%, -50%);
    width: 10em;
    height: 3em;
    text-align: center;
    background: #35ff6a;
    border-radius: 1em;
    color: white;
    cursor: pointer;
    transition: .25s;
    text-transform: uppercase;
  }

  .done:hover {
    box-shadow: 0px 0px 20px -3px #35ff6a;
  }

  .done p {
    line-height: 1em;
  }


  .font-awesome-sucks {
    display: block;
    position: relative;
    top: -1em;
  }

  .empty {
    color: #ffffff26;
    font-size: 1em;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    text-transform: uppercase;
  }

  .unready {
    position: absolute;
    right: 3em;
    top: 5.2em;
    border-radius: .8em;
    padding-left: .5em;
    padding-right: .5em;
    max-width: 12em;
    z-index: 1;
  }

  .unready p.link {
    font-size: .7em;
    text-transform: uppercase;
    text-align: left;
    background: #ff1f1f4d;
    width: fit-content;
    padding: 0.3em;
    border-radius: .5em;
    margin-left: 1em;
    padding-left: 1em;
    padding-right: 1em;
    margin: 0 auto;
    margin-top: 1em;
    margin-bottom: 1em;
    color: #ffffff7a;
    box-shadow: 0px 0px 20px -7px black;
    transition: .25s;
    cursor: pointer;
  }

  .unready p.link:hover {
    background: #db2828;
    color: white;
  }
</style>

<div class='page-wrapper'>
  <div class='switcher'>
    <div class='item' on:click={ setActive('ssh') } class:active={ active == 'ssh' ? true : false}>
      <p class='title'>SSH</p>
    </div>
    <div class='item' on:click={ setActive('telnet') } class:active={ active == 'telnet' ? true : false}>
      <p class='title'>Telnet</p>
    </div>
    <div class='unready'>
      <p class='link' on:click={ checkList }>Check my List</p>
    </div>
  </div>
  <div class='list'>
    <div class='head'>
      <div class='left'>
        <p class='title'>List of <span>{ active }</span> devices</p>
      </div>
      <div class='right'>
        <p on:click={ toggleModal } class='font-awesome-sucks'><i class='fas fa-plus icon add'></i></p>
      </div>
    </div>
    <div class='content'>
      {#if active == 'ssh'}
        {#each mySSHList as ssh}
          <div class='item'>
            <i class='fas fa-code-branch label icon text-green' class:unconfirmed={ ssh.status == 'unconfirmed' }></i>
            <p class='label'>
              <span>IP</span>
              { ssh.ip }:{ ssh.port }
            </p>
            <p class='label'>
              <span>Login</span>
              { ssh.user }:{ ssh.pass }
            </p>
            <p class='label status'>
              <span>Status</span>
              { ssh.status }
            </p>
            <p class='label'>
              <span>Actions</span>
              <i class='far fa-trash-alt'></i>
            </p>
          </div>
        {/each}
        {#if mySSHList.length == 0}
          <h1 class='empty'>Your list is empty...</h1>
        {/if}
      {:else}
        {#each myTelnetList as telnet}
          <div class='item'>
            <i class='fas fa-code-branch label icon text-green'></i>
            <p class='label'>
              <span>IP</span>
              { telnet.ip }:{ telnet.port }
            </p>
            <p class='label'>
              <span>Login</span>
              { telnet.user }:{ telnet.pass }
            </p>
            <p class='label'>
              <span>Status</span>
              { telnet.status }
            </p>
            <p class='label'>
              <span>Actions</span>
              <i class='far fa-trash-alt'></i>
            </p>
          </div>
        {/each}
        {#if myTelnetList.length == 0}
          <h1 class='empty'>Your list is empty...</h1>
        {/if}
      {/if}
      <div class='pager'>
        {#if _Client.getTotalPageCount(active) > 1 && activePage == _Client.getTotalPageCount(active)}
          <p on:click={ nextPage(activePage - 2) }>{ activePage - 2 }</p>
        {/if} 

        {#if activePage > 1}
          <p on:click={ nextPage(activePage - 1) }>{ activePage - 1 }</p>
        {/if}
        
        {#each range(activePage, activePage == 1 ? activePage + 3 : (activePage + 2) > _Client.getTotalPageCount(active) ? activePage + 1 : activePage + 2, 1) as i}
          {#if activePage > 0}
            {#if activePage < _Client.getTotalPageCount(active) - 1}
              <p on:click={ nextPage(i) } class:active={ (i) == activePage }>{ i }</p>
            {/if}
          {/if}
        {/each}

        {#if activePage == (_Client.getTotalPageCount(active) - 1)}
          <p class:active={ activePage == (_Client.getTotalPageCount(active) - 1) } on:click={ nextPage(activePage) }>{ activePage }</p>
        {/if}

        {#if activePage == (_Client.getTotalPageCount(active) - 1)}
          <p on:click={ nextPage(activePage + 1) }>{ activePage + 1 }</p>
        {/if}

        {#if activePage == _Client.getTotalPageCount(active)}
          <p class:active={ activePage == _Client.getTotalPageCount(active) }>{ activePage }</p>
        {/if}
      </div>
    </div>
  </div>
</div>

<div class='modal-wrapper' id="modal">
  <div class='inner'>
    <div class='head'>
      <div class='left'>
        <p class='title'>Add bots</p>
      </div>
      <div class='right'>
        <p class='font-awesome-sucks close-modal' on:click={ toggleModal }>
          <i class='fa fa-times'></i>
        </p>
      </div>
    </div>
    <div class='content'>
      <textarea bind:value={ altList } on:keyup={ isDone } placeholder="IP:PORT:USERNAME:PASSWORD" spellcheck="false"></textarea>
    </div>
  </div>
  <div class='done' id='done'>
    <p on:click={ addToList }>Done</p>
  </div>
</div>