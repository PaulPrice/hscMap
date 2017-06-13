declare module "*.vue" {
    import Vue from 'vue'
    export default Vue || typeof Vue
}

declare module '*.json' {
    const content: any
    export default content
}