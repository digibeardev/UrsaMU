
class functions {

    constructor() {
        this.functions = new Map()
    }

    add(name,value) {
        this.functions.set(name,value)
    }

    remove(name) {
        this.functions.delete(name)
    }

    
}

