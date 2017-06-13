import { sprintf } from "sprintf-js"


export const filters = {
    format(value: any, format: string) {
        return sprintf(format, value)
    }
}