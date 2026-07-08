`timescale 1ns / 1ps

module immediate_generator(

    input  logic [31:0] instruction,
    output logic [31:0] immediate

);

always_comb begin

    case(instruction[6:0])

        // I-Type
        7'b0010011,
        7'b0000011,
        7'b1100111:
            immediate = {{20{instruction[31]}}, instruction[31:20]};

        // S-Type
        7'b0100011:
            immediate = {{20{instruction[31]}},
                         instruction[31:25],
                         instruction[11:7]};

        // B-Type
        7'b1100011:
            immediate = {{19{instruction[31]}},
                         instruction[31],
                         instruction[7],
                         instruction[30:25],
                         instruction[11:8],
                         1'b0};

        // U-Type
        7'b0110111,
        7'b0010111:
            immediate = {instruction[31:12],12'b0};

        // J-Type
        7'b1101111:
            immediate = {{11{instruction[31]}},
                         instruction[31],
                         instruction[19:12],
                         instruction[20],
                         instruction[30:21],
                         1'b0};

        default:
            immediate = 32'b0;

    endcase

end

endmodule