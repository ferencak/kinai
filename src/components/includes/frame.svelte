<script>
  import Client from '../../services/client'
  const _Client = new Client()
</script>

<style>
  .frame-bar {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    height: 1.5em;
    background-color: #ffffff0f;
    width: -webkit-fill-available;
    -webkit-app-region: drag;
  }

  h1.logo {
    text-align: center;
    background: #ffffff14;
    color: white;
    position: absolute;
    width: 12em;
    font-size: .7em;
    left: 50%;
    margin: 0;
    height: -webkit-fill-available;
    line-height: 2.3em;
    transform: translateX(-50%);
    border-radius: 500vw;
  }
  .stats {
    display: block;
    position: absolute;
    left: 0em;
    top: -.4em;
    height: 2.9em;
  }

  .stats span {
    border-right: 1px solid #ffffff0d;
    margin-left: 0em;
  }

  .stats span:last-child {
    border-top-right-radius: 5px;
    border-bottom-right-radius: 5px;
    border-right: 0px
  }

  .stats span {
    display: inline-block;
    font-size: .6em;
    background: #ffffff05;
    color: #ffffff42;
    padding-left: 1em;
    padding-right: 1em;
    height: 3.2em;
    line-height: 2em;
    margin-left: -.4em;
  }

  .stats span p {
    display: inline-block;
  }

  .stats span p.count {
    background: #ffffff14;
    border-radius: 500px;
    width: 2.4em;
    text-align: center;
    color: #ffffff47;
    margin-right: .5em;
    margin-left: -.4em;
    font-size: .8em;
    line-height: 2.3em;
    position: relative;
    top: -.2em;
  }

  .right {
    width: 10em;
    float: right;
    text-align: right;
    height: 1.5em;
  }

  .right p {
    position: absolute;
    top: -.95em;
    right: 0em;
    color: #ffffff63;
    font-size: .6em;
    background: #ffffff05;
    padding-left: 1em;
    padding-right: 1em;
    padding-top: .6em;
    padding-bottom: .5em;
    transition: .25s;
    -webkit-app-region: no-drag;
    z-index: 100;
  }

  .right p.minimize:hover {
    background: red;
    color: white;
  }

  .right p.close:hover {
    background: rgb(0, 81, 255);
    color: white;
  }

  .right p.close {
    right: 2.7em;
    padding-top: .3em;
    padding-bottom: .8em;
  }

</style>

<div class='frame-bar'>
  <div class='stats'>
    <span>
      <p class='count'>0</p>
      <p>SSH</p>
    </span>
    <span>
      <p class='count'>0</p>
      <p>Telnet</p>
    </span>
    <span>
      <p class='count'>{ _Client.uCount }</p>
      <p>Unconfirmed</p>
    </span>
  </div>
  <h1 class='logo'>Kinai</h1>
  <div class='right'>
    <p class='close'>
      <i class='far fa-window-minimize'></i>
    </p>
    <p class='minimize'>
      <i class='fa fa-times'></i>
    </p>
  </div>
</div>