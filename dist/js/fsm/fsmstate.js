// FSM State Machine
class FSMState {
  // ID       - ID of this state
  // loopFunc - This state's update loop
  constructor(id, loopFunc, enterFunc = undefined, exitFunc = undefined, renderFunc = undefined) {
    console.log(sprintf('Creating state id [%s]', id))
    this.id = id;
    this.loopFunc = loopFunc;
    this.renderFunc = renderFunc;
    this.enterFunc = enterFunc;
    this.exitFunc = exitFunc;
    this.transitions = [];
  }
  // Adds an edge between this state and the target state ID
  addEdge(targetState, conditionFunc) {
    this.transitions.push({
      conditionFunc: conditionFunc,
      targetState: targetState
    })
  }
  next(transition) {
    if (this.exit) this.exit();
    console.log(sprintf('Transitioning from [%s] to [%s]', this.id, transition.targetState.id));
    if (transition.targetState.enter) transition.targetState.enter();
    return transition.targetState;
  }
  enter() {
    if (this.enterFunc) this.enterFunc();
  }
  exit() {
    if (this.exitFunc) this.exitFunc();
  }
  update() {
    this.loopFunc();
    for (var i = this.transitions.length - 1; i >= 0; i--) {
      var currTransition = this.transitions[i];
      if (currTransition.conditionFunc()) {
        return this.next(currTransition);
      }
    }
    return this;
  }
  render() {
    if (this.renderFunc) this.renderFunc();
  }
}
