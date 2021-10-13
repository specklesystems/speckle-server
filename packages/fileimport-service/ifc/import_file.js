const fs = require( 'fs' )

const TMP_RESULTS_PATH = '/tmp/import_result.json'

const { parseAndCreateCommit } = require( './index' )

async function main() {
    let cmdArgs = process.argv.slice( 2 )

    let [ filePath, userId, streamId, branchName, commitMessage ] = cmdArgs

    console.log( 'ARGV: ', filePath, userId, streamId, branchName, commitMessage )

    const data = fs.readFileSync( filePath )

    let ifcInput = {
        data,
        streamId: streamId,
        userId: userId,
        message: commitMessage || 'Imported file'
    }
    if ( branchName ) ifcInput.branchName = branchName

    let output = {
        success: false,
        error: 'Unknown error'
    }

    try {
        let commitId = await parseAndCreateCommit( ifcInput )
        output = {
            success: true,
            commitId
        }
    } catch ( err ) {
        output = {
            success: false,
            error: err.toString()
        }
    }
    
    fs.writeFileSync( TMP_RESULTS_PATH, JSON.stringify( output ) )
    
    process.exit( 0 )
}

main()
