<script>
  // import validate from './validate';
  export let label;
  export let name;
  export let isDark;
  export let type = 'text';
  export let required = true;
</script>

<div>
  <label for={name}>{label}</label>
  <input {required} {type} id={name} {name} class="nes-input" class:is-dark={isDark}>
</div>