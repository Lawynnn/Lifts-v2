module.exports.commentsReader = {
    leaveComments: false,
    read(script) {
        let regex_comment = /@\/\/(.*)/g;
        let regex_leave_comments = /@leaveComments/g;
        [...script.matchAll(regex_comment)].forEach(match => {
            [...script.matchAll(regex_leave_comments)].forEach(leaveMatch => {
                this.leaveComments = true;
            })

            if(!this.leaveComments)
                script = script.replace(match[0], '');
        })

        return script;
    }

}