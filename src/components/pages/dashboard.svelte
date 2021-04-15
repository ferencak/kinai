<script>

</script>

<style>

.stats {
  display: block;
  width: -webkit-fill-available;
  height: 10em;
  position: relative;
  top: 3em;
  margin: 0 auto;
  margin-left: 5em;
  margin-right: 5em;
  text-align: center;
}

.stats .box {
  display: inline-block;
  width: 15em;
  height: 6em;
  background: linear-gradient(45deg, #fdfdfd05, #00000029);
  border-radius: 1em;
  box-shadow: 0px 0px 36px -23px black;
  margin-left: 1em;
  margin-right: 1em;
  color: #ffffff0d;
  transition: .25s;
  cursor: pointer;
  overflow: hidden;
}

.stats .box:hover {
  color: white;
}

.stats .box .icon {
  font-size: 3em;
  position: relative;
  color: #ffffff08;
  top: -1em;
  margin-bottom: .2em;
  left: -2.3em;
  background: #ffffff03;
  padding: .5em;
  border-radius: 500px;
}

.stats .box p {
  color: inherit;
  text-transform: uppercase;
  margin-top: -5.2em;
}

.stats .box span {
  font-size: 2em;
  color: inherit;
  position: relative;
  top: -.5em;
}

.actions {
  display: block;
  width: 49.5em;
  height: 3em;
  position: relative;
  top: 1em;
  margin: 0 auto;
  background: linear-gradient(45deg, #fdfdfd05, #00000029);
  border-radius: 1em;
  box-shadow: 0px 0px 36px -14px black;
  text-align: center;
}

.actions p {
  display: inline-block;
  position: relative;
  float: left;
  left: 2em;
  top: -.2em;
  color: #ffffff17;
  text-transform: uppercase;
}

.actions .action {
  display: inline-block;
  float: right;
  margin-right: .5em;
  position: relative;
  top: -.2em;
  right: 2.5em;
  cursor: pointer;
}
.actions .action p {
  padding: .2em;
  border-radius: 1em;
  padding-left: 1em;
  padding-right: 1em;
  background: #ffffff0a;
  color: #ffffff1f;
  transition: .25s;
}
.actions .action p:hover {
  background: linear-gradient(45deg, #6781ff, #b400ff);
  box-shadow: 0px 0px 28px -3px #e482fd75;
  color: white;
}

.overview {
  display: block;
  width: 49.5em;
  height: 12em;
  position: relative;
  top: 3em;
  margin: 0 auto;
  background: linear-gradient(45deg, #fdfdfd05, #00000029);
  border-radius: 1em;
  box-shadow: 0px 0px 36px -14px black;
}

.overview p.title {
  display: block;
  float: left;
  color: #ffffff17;
  text-transform: uppercase;
  width: -webkit-fill-available;
  margin-left: 2em;
}

.overview .items {
  margin-left: 2em;
  margin-right: 2em;
  height: -webkit-fill-available;
  text-align: center;
}

.overview .items .item {
  display: inline-grid;
  width: 10em;
  height: 5em;
  margin-bottom: .5em;
  border-radius: 1em;
  box-shadow: 0px 0px 20px -14px black;
  background: linear-gradient(45deg, #fdfdfd05, #00000029);
  margin-left: .5em;
  margin-right: .5em;
}

.overview .items .item p {
  color: #ffffff1a;
  display: block;
  width: -webkit-fill-available;
  text-align: center;
  margin-bottom: 1.5em;
}

.overview .items .item span {
  color: #ffffff12;
  display: block;
  width: -webkit-fill-available;
  margin-top: -1.5em;
  text-align: center;
  background: #42424212;
  border-bottom-left-radius: 1em;
  border-bottom-right-radius: 1em;
  padding-top: .5em;
}

.text-green {
  color: #2aff2a!important;
  text-shadow: 0px 0px 10px #10ff10;
}

.text-dark {
  color: #ffffff30!important;
  text-shadow: 0px 0px 10px #060606;
}

</style>

<div class='page-wrapper'>
  <div class='stats'>
    <div class='box'>
      <i class='fas fa-globe icon'></i>
      <p>Total count</p>
      <span>0</span>
    </div>
    <div class='box'>
      <i class='fas fa-laptop-code icon'></i>
      <p>SSH Bots</p>
      <span>0</span>
    </div>
    <div class='box'>
      <i class='fas fa-microchip icon'></i>
      <p>Telnet Bots</p>
      <span>0</span>
    </div>
  </div>
  <div class='actions'>
    <p>Binded Actions</p>
    <div class='action'>
      <p>Crypto BTC</p>
    </div>
    <div class='action'>
      <p>Crypto XMR</p>
    </div>
    <div class='action'>
      <p>Selfrep</p>
    </div>
  </div>

  <div class='overview'>
    <p class='title'>Overview</p>
    <div class='items'>
      <div class='item'>
        <p>System status</p>
        <span class='text-green'>Online</span>
      </div>
      <div class='item'>
        <p>Bot status</p>
        <span class='text-green'>Undetected</span>
      </div>
      <div class='item'>
        <p>Pre-defined port</p>
        <span class='text-dark'>3000</span>
      </div>
      <div class='item'>
        <p>Current action</p>
        <span class='text-dark'>Crypto XMR</span>
      </div>
    </div>
  </div>

</div>