<script lang="ts">
  import {onDestroy} from "svelte"
  export let openened = false;

  const toggleBurger = () => {
    openened = !openened;
    console.log(openened);
  };

  onDestroy(() => {
    openened=false
  })
</script>

<style>
  label.hamburg {
    display: block;
    background: var(--theme-backgournd);
    width: 50px;
    height: 25px;
    position: relative;
    margin-left: auto;
    margin-right: auto;
    border-radius: 4px;
  }

  input#hamburg {
    display: none;
  }

  .line {
    position: absolute;
    left: 10px;
    height: 3px;
    width: 25px;
    background: var(--theme-primary);
    border-radius: 2px;
    display: block;
    transition: 0.5s;
    transform-origin: center;
  }

  .line:nth-child(1) {
    top: 6px;
  }
  .line:nth-child(2) {
    top: 12px;
  }
  .line:nth-child(3) {
    top: 18px;
  }

  #hamburg:checked + .hamburg .line:nth-child(1) {
    transform: translateY(6px) rotate(-45deg);
  }

  #hamburg:checked + .hamburg .line:nth-child(2) {
    opacity: 0;
  }

  #hamburg:checked + .hamburg .line:nth-child(3) {
    transform: translateY(-6px) rotate(45deg);
  }
</style>

<div class="row">
  <input type="checkbox" id="hamburg" on:change={toggleBurger} />
  <label for="hamburg" class="hamburg">
    <span class="line" />
    <span class="line" />
    <span class="line" />
  </label>
</div>
