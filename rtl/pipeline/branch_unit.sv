`timescale 1ns / 1ps

module branch_unit(

    input  logic Branch,
    input  logic Jump,
    input  logic Zero,

    input  logic [31:0] pc,
    input  logic [31:0] immediate,

    output logic [31:0] next_pc

);

always_comb begin

    if (Jump)
        next_pc = pc + immediate;

    else if (Branch && Zero)
        next_pc = pc + immediate;

    else
        next_pc = pc + 32'd4;

end

endmodule